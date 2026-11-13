"""Modul A: asosiasi objek PPE ke person, voting jendela waktu, status atribut/person (PRD 6.1.3-6.1.4).

Kode memakai NAMA kelas, bukan ID: urutan ID di data.yaml Roboflow (alfabetis) berbeda dari tabel PRD.
"""
from collections import deque

# kelas -> (atribut, positif?)
CLASS_ATTR = {
    "helmet": ("head", True), "no_helmet": ("head", False),
    "coverall": ("body", True), "no_coverall": ("body", False),
    "jeans": ("legs", True),  # tidak ada no_jeans: celana hanya OK / UNVERIFIED
    "safety_shoes": ("feet", True), "no_safety_shoes": ("feet", False),
}
ATTRS = ("head", "body", "legs", "feet")
ATTR_LABEL = {"head": "kepala", "body": "badan", "legs": "kaki", "feet": "alas kaki"}
VIOLATION_TEXT = {"head": "tanpa helm", "body": "bukan baju praktikum", "feet": "bukan sepatu safety"}


def _inter(a, b):
    w = min(a[2], b[2]) - max(a[0], b[0])
    h = min(a[3], b[3]) - max(a[1], b[1])
    return max(0.0, w) * max(0.0, h)


def associate(persons, items, zones):
    """persons: {track_id: (x1,y1,x2,y2)}; items: [(cls, conf, (x1,y1,x2,y2))].
    Return {track_id: {attr: {"pos": max_conf, "neg": max_conf}}} untuk satu frame."""
    out = {tid: {} for tid in persons}
    for cls, conf, box in items:
        if cls not in CLASS_ATTR:
            continue
        attr, positive = CLASS_ATTR[cls]
        lo, hi = zones[attr]
        cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
        best, best_ov = None, 0.0
        for tid, p in persons.items():
            if not (p[0] <= cx <= p[2] and p[1] <= cy <= p[3]):
                continue
            rel = (cy - p[1]) / max(p[3] - p[1], 1e-6)
            if not (lo <= rel <= hi):
                continue
            ov = _inter(box, p)
            if ov > best_ov:
                best, best_ov = tid, ov
        if best is not None:
            slot = out[best].setdefault(attr, {"pos": 0.0, "neg": 0.0})
            key = "pos" if positive else "neg"
            slot[key] = max(slot[key], conf)
    return out


class PersonPPE:
    """Riwayat voting 15 frame terakhir untuk satu track_id."""

    def __init__(self, window=15, ratio=0.6):
        self.window, self.ratio = window, ratio
        self.hist = deque(maxlen=window)  # tiap elemen: {attr: {"pos","neg"}}

    def update(self, frame_obs):
        self.hist.append(frame_obs)

    def attr_status(self, attr):
        """Return (status, avg_conf). Rasio dihitung terhadap ukuran jendela penuh."""
        pos = [f[attr]["pos"] for f in self.hist if attr in f and f[attr]["pos"] > 0]
        neg = [f[attr]["neg"] for f in self.hist if attr in f and f[attr]["neg"] > 0]
        ok = len(pos) / self.window >= self.ratio
        bad = len(neg) / self.window >= self.ratio
        avg = lambda xs: sum(xs) / len(xs) if xs else 0.0
        if ok and bad:  # pasangan bertentangan: ambil confidence rata-rata lebih tinggi
            return ("OK", avg(pos)) if avg(pos) >= avg(neg) else ("VIOLATION", avg(neg))
        if ok:
            return "OK", avg(pos)
        if bad:
            return "VIOLATION", avg(neg)
        return "UNVERIFIED", 0.0

    def status(self, required):
        """Return (person_status, {attr: status}, avg_conf_violations)."""
        attrs = {a: self.attr_status(a) for a in ATTRS}
        req = [attrs[a] for a in required]
        viol = [c for s, c in req if s == "VIOLATION"]
        if viol:
            st = "NON_COMPLIANT"
        elif req and all(s == "OK" for s, _ in req):
            st = "COMPLIANT"
        elif not req:
            st = "COMPLIANT"
        else:
            st = "UNVERIFIED"
        return st, {a: s for a, (s, _) in attrs.items()}, (sum(viol) / len(viol) if viol else 0.0)


def violation_findings(attr_status, required):
    """Teks temuan untuk notifikasi, mis. 'kepala: tanpa helm'."""
    return [f"{ATTR_LABEL[a]}: {VIOLATION_TEXT[a]}" for a in required
            if attr_status.get(a) == "VIOLATION" and a in VIOLATION_TEXT]
