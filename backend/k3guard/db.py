"""SQLite (PRD bagian 7). Satu koneksi bersama + lock; cukup untuk satu kamera dan beberapa pengguna."""
import json
import sqlite3
import threading
from datetime import datetime

import bcrypt

from .config import CFG, DATA_DIR

_conn = sqlite3.connect(DATA_DIR / "k3guard.db", check_same_thread=False)
_conn.row_factory = sqlite3.Row
_lock = threading.Lock()

SCHEMA = """
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, nama TEXT, email TEXT UNIQUE, password_hash TEXT,
  role TEXT CHECK(role IN ('student','officer')), created_at TEXT);
CREATE TABLE IF NOT EXISTS areas(id INTEGER PRIMARY KEY, nama TEXT, deskripsi TEXT);
CREATE TABLE IF NOT EXISTS area_rules(id INTEGER PRIMARY KEY, area_id INTEGER, attribute TEXT, required INTEGER,
  UNIQUE(area_id, attribute));
CREATE TABLE IF NOT EXISTS cameras(id INTEGER PRIMARY KEY, area_id INTEGER, nama TEXT, source TEXT, aktif INTEGER);
CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, type TEXT, area_id INTEGER, camera_id INTEGER,
  track_id INTEGER, detail TEXT, confidence REAL, created_at TEXT, verification TEXT DEFAULT 'pending',
  verified_by INTEGER, verified_at TEXT, follow_up_note TEXT);
CREATE TABLE IF NOT EXISTS event_media(id INTEGER PRIMARY KEY, event_id INTEGER, file_path TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY, event_id INTEGER, channel TEXT, status TEXT, sent_at TEXT);
CREATE TABLE IF NOT EXISTS sop_documents(id INTEGER PRIMARY KEY, nama_file TEXT, versi INTEGER, uploaded_by INTEGER,
  uploaded_at TEXT, status_index TEXT, file_path TEXT);
CREATE TABLE IF NOT EXISTS sop_chunks(id INTEGER PRIMARY KEY, doc_id INTEGER, section TEXT, text TEXT, embedding BLOB);
CREATE TABLE IF NOT EXISTS chat_logs(id INTEGER PRIMARY KEY, session_id TEXT, user_id INTEGER, pertanyaan TEXT,
  jawaban TEXT, sumber TEXT, answered INTEGER, created_at TEXT);
CREATE INDEX IF NOT EXISTS ix_events_created ON events(created_at);
"""


def now():
    return datetime.now().isoformat(timespec="seconds")


def q(sql, args=(), one=False):
    with _lock:
        cur = _conn.execute(sql, args)
        rows = [dict(r) for r in cur.fetchall()]
    return (rows[0] if rows else None) if one else rows


def ex(sql, args=()):
    with _lock:
        cur = _conn.execute(sql, args)
        _conn.commit()
        return cur.lastrowid


def init():
    with _lock:
        _conn.executescript(SCHEMA)
        _conn.commit()
    for a in CFG["areas"]:
        if not q("SELECT 1 FROM areas WHERE id=?", (a["id"],), one=True):
            ex("INSERT INTO areas(id,nama,deskripsi) VALUES(?,?,?)", (a["id"], a["name"], a.get("description", "")))
            for attr in ("head", "body", "legs", "feet"):
                ex("INSERT INTO area_rules(area_id,attribute,required) VALUES(?,?,?)",
                   (a["id"], attr, int(attr in a["required"])))
    cam = CFG["camera"]
    ex("INSERT OR REPLACE INTO cameras(id,area_id,nama,source,aktif) VALUES(?,?,?,?,1)",
       (cam["id"], cam["area_id"], cam["name"], str(cam["source"])))
    if not q("SELECT 1 FROM users", one=True):
        # akun awal demo (login pakai username) - ganti password sebelum dipakai sungguhan
        add_user("Petugas K3", "petugask3", "123", "officer")
        add_user("Mahasiswa", "mahasiswa", "123", "student")
    # migrasi sekali: akun demo versi lama -> username sekarang
    for old, new in (("petugas@k3guard.local", "petugask3"), ("petugas", "petugask3"),
                     ("mahasiswa@k3guard.local", "mahasiswa")):
        if q("SELECT 1 FROM users WHERE email=?", (old,), one=True) and not q("SELECT 1 FROM users WHERE email=?", (new,), one=True):
            h = bcrypt.hashpw(b"123", bcrypt.gensalt()).decode()
            ex("UPDATE users SET email=?, password_hash=? WHERE email=?", (new, h, old))


def add_user(nama, username, password, role):  # kolom "email" menyimpan username (tanpa migrasi skema)
    h = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    return ex("INSERT INTO users(nama,email,password_hash,role,created_at) VALUES(?,?,?,?,?)",
              (nama, username.strip().lower(), h, role, now()))


def check_password(username, password):
    u = q("SELECT * FROM users WHERE email=?", (username.strip().lower(),), one=True)
    if u and bcrypt.checkpw(password.encode(), u["password_hash"].encode()):
        return u
    return None


def required_attrs(area_id):
    return [r["attribute"] for r in q("SELECT attribute FROM area_rules WHERE area_id=? AND required=1", (area_id,))]


def add_event(type_, area_id, camera_id, track_id, detail, confidence, media_paths):
    eid = ex("INSERT INTO events(type,area_id,camera_id,track_id,detail,confidence,created_at) VALUES(?,?,?,?,?,?,?)",
             (type_, area_id, camera_id, track_id, json.dumps(detail, ensure_ascii=False), confidence, now()))
    for p in media_paths:
        ex("INSERT INTO event_media(event_id,file_path,created_at) VALUES(?,?,?)", (eid, str(p), now()))
    return eid


if __name__ == "__main__":
    # tambah akun: python -m k3guard.db "Nama" username password student|officer
    import sys
    init()
    print("user id", add_user(*sys.argv[1:5]))
