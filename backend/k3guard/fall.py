"""Modul C: fitur pose + mesin status jatuh, dan voting kelas person_danger (PRD 6.3)."""
import math
from collections import deque

# indeks keypoint COCO
L_SH, R_SH, L_HIP, R_HIP = 5, 6, 11, 12


def pose_features(kpts, kconf, box, min_conf):
    """kpts: list 17x(x,y), kconf: 17 confidence, box: (x1,y1,x2,y2).
    Return dict fitur, atau None bila keypoint bahu/pinggul tidak cukup terlihat."""
    if min(kconf[i] for i in (L_SH, R_SH, L_HIP, R_HIP)) < min_conf:
        return None
    sx, sy = (kpts[L_SH][0] + kpts[R_SH][0]) / 2, (kpts[L_SH][1] + kpts[R_SH][1]) / 2
    hx, hy = (kpts[L_HIP][0] + kpts[R_HIP][0]) / 2, (kpts[L_HIP][1] + kpts[R_HIP][1]) / 2
    angle = math.degrees(math.atan2(abs(hx - sx), abs(hy - sy) + 1e-6))  # 0 = tegak, 90 = berbaring
    w, h = box[2] - box[0], box[3] - box[1]
    return {"angle": angle, "ratio": w / max(h, 1e-6), "hip_y": hy, "height": h}


class FallStateMachine:
    """NORMAL -> FALLING -> LYING -> ALERT, kembali NORMAL bila tegak (<40°) >= 1 dtk."""

    def __init__(self, c):
        self.c = c
        self.state = "NORMAL"
        self.angles = deque()      # (t, angle) 1 detik terakhir
        self.hips = deque()        # (t, hip_y)
        self.ref_height = None     # tinggi bbox saat berdiri, untuk normalisasi kecepatan turun
        self.lying_since = None
        self.upright_since = None
        self.pose_unverified = False
        self.alert_fired = False

    def update(self, t, f):
        """f: hasil pose_features (boleh None). Return state saat ini."""
        c = self.c
        if f is None:  # keypoint kurang: jangan naikkan status ke ALERT
            self.pose_unverified = True
            return self.state
        self.pose_unverified = False
        win = c["falling_within_seconds"]
        self.angles.append((t, f["angle"]))
        self.hips.append((t, f["hip_y"]))
        while self.angles and t - self.angles[0][0] > win:
            self.angles.popleft()
        while self.hips and t - self.hips[0][0] > win:
            self.hips.popleft()
        if self.state == "NORMAL" and f["angle"] < c["falling_angle_from"]:
            self.ref_height = f["height"] if self.ref_height is None else 0.9 * self.ref_height + 0.1 * f["height"]

        # kembali normal
        if f["angle"] < c["recover_angle"]:
            self.upright_since = self.upright_since or t
            if t - self.upright_since >= c["recover_seconds"]:
                self.state, self.lying_since, self.alert_fired = "NORMAL", None, False
                return self.state
        else:
            self.upright_since = None

        if self.state == "NORMAL":
            dt = t - self.hips[0][0]
            speed = (f["hip_y"] - self.hips[0][1]) / max(dt, 1e-6) / (self.ref_height or f["height"])
            angle_jump = min(a for _, a in self.angles) < c["falling_angle_from"] and f["angle"] > c["falling_angle_to"]
            if (dt > 0 and speed > c["hip_drop_speed"]) or angle_jump:
                self.state = "FALLING"

        lying = f["angle"] > c["lying_angle"] and f["ratio"] > c["lying_ratio"]
        if self.state in ("FALLING", "LYING", "ALERT"):
            if lying:
                if self.state == "FALLING":
                    self.state, self.lying_since = "LYING", t
                if self.state == "LYING" and t - self.lying_since >= c["alert_seconds"]:
                    self.state = "ALERT"
            elif self.state in ("LYING", "ALERT"):
                self.state, self.lying_since = "FALLING", None
        return self.state


class DangerVote:
    """Sinyal model: person_danger di >= 60% frame dalam jendela >= 3 dtk."""

    def __init__(self, seconds=3, ratio=0.6):
        self.seconds, self.ratio = seconds, ratio
        self.hist = deque()  # (t, is_danger)

    def update(self, t, is_danger):
        self.hist.append((t, is_danger))
        while self.hist and t - self.hist[0][0] > self.seconds:
            self.hist.popleft()

    def fraction(self):
        return sum(d for _, d in self.hist) / len(self.hist) if self.hist else 0.0

    def triggered(self):
        if not self.hist or self.hist[-1][0] - self.hist[0][0] < self.seconds * 0.9:
            return False  # jendela belum penuh 3 detik
        return self.fraction() >= self.ratio
