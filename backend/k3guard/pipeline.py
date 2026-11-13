"""Pipeline CV satu kamera: YOLO PPE + YOLO-pose (person, track_id, keypoint) -> status PPE & jatuh -> kejadian.

Person dan track_id diambil dari model pose pretrained (COCO), karena dataset hanya punya sedikit box person
(person_danger ~12 instance). Kelas person_safe/person_danger dari model PPE dicocokkan ke person via IoU
dan dipakai sebagai sinyal 'model' (PRD 6.3.1).
"""
import threading
import time
from datetime import datetime
from pathlib import Path

import cv2

from . import db, notify
from .config import CFG, MEDIA_DIR, ROOT
from .fall import DangerVote, FallStateMachine, pose_features
from .ppe import ATTR_LABEL, PersonPPE, associate, violation_findings

COLORS = {"COMPLIANT": (60, 180, 75), "NON_COMPLIANT": (40, 40, 230), "UNVERIFIED": (0, 200, 255),
          "DANGER": (200, 0, 200)}


def iou(a, b):
    w = max(0, min(a[2], b[2]) - max(a[0], b[0]))
    h = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    i = w * h
    return i / ((a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - i + 1e-6)


class Track:
    def __init__(self):
        c = CFG
        self.ppe = PersonPPE(c["ppe"]["window_frames"], c["ppe"]["vote_ratio"])
        self.fall = FallStateMachine(c["fall"])
        self.danger = DangerVote(c["fall"]["vote_window_seconds"], c["fall"]["vote_ratio"])
        self.noncompliant_since = None
        self.last_ppe_event = {}   # frozenset(pelanggaran) -> waktu
        self.last_fall_event = 0.0
        self.alert_since = None
        self.alert_gap_since = None
        self.fall_notified = False
        self.fall_start_frame = None
        self.last_seen = 0.0


class Pipeline:
    def __init__(self, source=None):
        cam = CFG["camera"]
        self.source = cam["source"] if source is None else source
        if isinstance(self.source, str) and self.source.isdigit():
            self.source = int(self.source)
        self.cam_id, self.area_id = cam["id"], cam["area_id"]
        self.jpeg = None
        self.status = {"camera": "starting", "model": "loading", "persons": [], "fps": 0.0}
        self.tracks = {}
        self._rules_t, self._required = 0, []
        self._stop = threading.Event()
        self._thread = None

    # ---- lifecycle
    @property
    def running(self):
        return bool(self._thread and self._thread.is_alive() and not self._stop.is_set())

    def start(self):
        if self.running:
            return
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=5)  # stop() sebelumnya belum selesai
        self._stop.clear()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self):
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=5)
        self.jpeg = None
        self.status.update(camera="mati", persons=[], fps=0.0)

    def _load_models(self):
        from ultralytics import YOLO
        w = ROOT / CFG["model"]["ppe_weights"]
        if not w.exists():
            self.status["model"] = f"model belum ada ({w.name}); jalankan train.py"
            return None, None
        ppe, pose = YOLO(str(w.resolve())), YOLO(str((ROOT / CFG["model"]["pose_weights"]).resolve()))
        self.status["model"] = f"aktif ({CFG['model']['version']})"
        return ppe, pose

    def _run(self):
        ppe, pose = self._load_models()
        if ppe is None:
            return
        period = 1.0 / CFG["model"]["infer_fps"]
        cap = None
        while not self._stop.is_set():
            if cap is None or not cap.isOpened():
                # webcam index: backend MSMF default sering gagal grab frame di Windows, DSHOW lebih stabil
                cap = cv2.VideoCapture(self.source, cv2.CAP_DSHOW) if isinstance(self.source, int) else cv2.VideoCapture(self.source)
                if not cap.isOpened():
                    self.status["camera"] = "mati"
                    time.sleep(2)  # coba sambung ulang (PRD 10: keandalan)
                    continue
                self.status["camera"] = "aktif"
            t0 = time.time()
            ok, frame = cap.read()
            if not ok:
                if isinstance(self.source, str) and CFG["camera"].get("loop_video") and Path(self.source).exists():
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                self.status["camera"] = "mati"
                cap.release()
                cap = None
                continue
            try:
                self._process(frame, ppe, pose, t0)
            except Exception as e:  # satu frame gagal tidak boleh mematikan pemantauan
                self.status["error"] = repr(e)
            dt = time.time() - t0
            self.status["fps"] = round(1.0 / max(dt, period), 1)
            if dt < period:
                time.sleep(period - dt)
        if cap is not None:  # stop() dari dashboard: lepaskan kamera supaya bisa dibuka lagi
            cap.release()

    # ---- per frame
    def required(self):
        if time.time() - self._rules_t > 5:  # aturan area dibaca ulang tiap 5 dtk (bisa diubah dari dashboard)
            self._required, self._rules_t = db.required_attrs(self.area_id), time.time()
        return self._required

    def _process(self, frame, ppe_model, pose_model, t):
        m = CFG["model"]
        pr = pose_model.track(frame, persist=True, tracker="bytetrack.yaml", classes=[0], conf=0.4,
                              imgsz=m["imgsz"], device=m["device"], verbose=False)[0]
        dr = ppe_model(frame, conf=min(CFG["conf"].values()), imgsz=m["imgsz"], device=m["device"], verbose=False)[0]

        persons, kp = {}, {}
        if pr.boxes.id is not None:
            for i, tid in enumerate(pr.boxes.id.int().tolist()):
                persons[tid] = tuple(pr.boxes.xyxy[i].tolist())
                kp[tid] = (pr.keypoints.xy[i].tolist(), pr.keypoints.conf[i].tolist())

        items, person_cls = [], []
        for b in dr.boxes:
            name = dr.names[int(b.cls)]
            conf = float(b.conf)
            if conf < CFG["conf"].get(name, CFG["conf"]["default"]):
                continue
            box = tuple(b.xyxy[0].tolist())
            (person_cls if name.startswith("person_") else items).append((name, conf, box))

        obs = associate(persons, items, CFG["zones"])
        required = self.required()
        annotated = frame.copy()
        for name, conf, box in items:
            x1, y1, x2, y2 = map(int, box)
            col = (40, 40, 230) if name.startswith("no_") else (200, 160, 0)
            cv2.rectangle(annotated, (x1, y1), (x2, y2), col, 1)
            cv2.putText(annotated, f"{name} {conf:.2f}", (x1, max(y1 - 3, 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.4, col, 1)

        out = []
        for tid, box in persons.items():
            tr = self.tracks.setdefault(tid, Track())
            tr.last_seen = t
            # sinyal model: person_* dengan IoU terbesar
            best = max(person_cls, key=lambda p: iou(p[2], box), default=None)
            is_danger = bool(best and iou(best[2], box) > 0.3 and best[0] == "person_danger")
            tr.danger.update(t, is_danger)
            prev_state = tr.fall.state
            state = tr.fall.update(t, pose_features(*kp[tid], box, CFG["fall"]["min_kpt_conf"]))
            if state == "FALLING" and prev_state == "NORMAL":
                tr.fall_start_frame = annotated.copy()

            danger_now = state != "NORMAL" or tr.danger.fraction() > 0.5
            if danger_now:  # orang jatuh/terbaring tidak dinilai perlengkapannya (PRD 6.1.3)
                pstatus, attrs = "DANGER", {}
                tr.noncompliant_since = None
            else:
                tr.ppe.update(obs.get(tid, {}))
                pstatus, attrs, vconf = tr.ppe.status(required)
                self._check_ppe_event(tid, tr, pstatus, attrs, vconf, required, annotated, box, t)
            if pstatus == "UNVERIFIED":  # belum bisa dinilai -> jangan digambar (mis. pantulan cermin, orang terpotong)
                self._check_fall_event(tid, tr, state, annotated, box, t)
                out.append({"track_id": tid, "status": pstatus, "fall_state": state, "pose_unverified": tr.fall.pose_unverified,
                            "attributes": {ATTR_LABEL[a]: s for a, s in attrs.items()}, "attrs": attrs})
                continue
            x1, y1, x2, y2 = map(int, box)
            col = COLORS[pstatus]
            cls = "person_danger" if pstatus == "DANGER" else "person_safe"  # label sesuai kelas dataset
            detail = state if pstatus == "DANGER" else pstatus
            cv2.rectangle(annotated, (x1, y1), (x2, y2), col, 2)
            cv2.putText(annotated, f"ID {tid} {cls} {detail}", (x1, max(y1 - 6, 12)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, col, 2)
            if attrs:  # alasan status: tiap bagian OK / VIOLATION / ? (belum terverifikasi)
                sym = {"OK": "ok", "VIOLATION": "X", "UNVERIFIED": "?"}
                cv2.putText(annotated, " ".join(f"{k}:{sym[attrs[a]]}" for k, a in (("H", "head"), ("B", "body"), ("L", "legs"), ("F", "feet"))),
                            (x1 + 4, y1 + 18), cv2.FONT_HERSHEY_SIMPLEX, 0.55, col, 2)
            # dipanggil setelah label person digambar, supaya foto kejadian memuat "person_danger"
            self._check_fall_event(tid, tr, state, annotated, box, t)
            out.append({"track_id": tid, "status": pstatus, "fall_state": state,
                        "pose_unverified": tr.fall.pose_unverified,
                        "attributes": {ATTR_LABEL[a]: s for a, s in attrs.items()}, "attrs": attrs})

        for tid in [k for k, v in self.tracks.items() if t - v.last_seen > 30]:
            del self.tracks[tid]
        self.status["persons"] = out
        self.status["updated_at"] = datetime.now().isoformat(timespec="seconds")
        self.jpeg = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 75])[1].tobytes()

    # ---- kejadian
    def _save(self, img, tag):
        p = MEDIA_DIR / f"{datetime.now():%Y%m%d_%H%M%S_%f}_{tag}.jpg"
        cv2.imwrite(str(p), img)
        return p

    def _versions(self):
        return {"model_version": CFG["model"]["version"], "zones": CFG["zones"], "ppe": CFG["ppe"], "conf": CFG["conf"]}

    def _check_ppe_event(self, tid, tr, pstatus, attrs, vconf, required, img, box, t):
        if pstatus != "NON_COMPLIANT":
            tr.noncompliant_since = None
            return
        tr.noncompliant_since = tr.noncompliant_since or t
        if t - tr.noncompliant_since < CFG["ppe"]["violation_seconds"]:
            return
        viol = frozenset(a for a in required if attrs.get(a) == "VIOLATION")
        if t - tr.last_ppe_event.get(viol, -1e9) < CFG["ppe"]["cooldown_seconds"]:
            return
        tr.last_ppe_event[viol] = t
        findings = violation_findings(attrs, required)
        photo = self._save(img, "ppe")
        detail = {"violations": sorted(viol), "findings": findings, "bbox": box, **self._versions()}
        eid = db.add_event("ppe_violation", self.area_id, self.cam_id, tid, detail, vconf, [photo])
        notify.send_async(eid, notify.format_message("ppe_violation", self._area_name(), db.now(), findings), photo, telegram=False)

    def _check_fall_event(self, tid, tr, state, img, box, t):
        pose_alert = state == "ALERT"
        model_alert = tr.danger.triggered()
        if pose_alert or model_alert:
            tr.alert_gap_since = None
            tr.alert_since = tr.alert_since or t
        else:  # toleransi kedip 1 dtk; setelah itu dianggap sudah bangun -> boleh notifikasi lagi untuk jatuh berikutnya
            tr.alert_gap_since = tr.alert_gap_since or t
            if t - tr.alert_gap_since > 1.0:
                tr.alert_since, tr.fall_notified = None, False
            return
        # verifikasi: harus terus terkapar >= hold_seconds, lalu kirim 1 kali per kejadian
        if tr.fall_notified or t - tr.alert_since < CFG["fall"]["hold_seconds"]:
            return
        tr.fall_notified = True
        tr.last_fall_event = t
        source = "both" if pose_alert and model_alert else ("pose" if pose_alert else "model")
        photos = [self._save(img, "fall")]
        if tr.fall_start_frame is not None:
            photos.insert(0, self._save(tr.fall_start_frame, "fall_start"))
            tr.fall_start_frame = None
        detail = {"source": source, "fall_state": state, "danger_fraction": round(tr.danger.fraction(), 2),
                  "bbox": box, **self._versions()}
        eid = db.add_event("fall_detected", self.area_id, self.cam_id, tid, detail, tr.danger.fraction(), photos)
        notify.send_async(eid, notify.format_message("fall_detected", self._area_name(), db.now()), photos[-1])

    def _area_name(self):
        a = db.q("SELECT nama FROM areas WHERE id=?", (self.area_id,), one=True)
        return a["nama"] if a else str(self.area_id)
