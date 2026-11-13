"""Backend FastAPI. Kontrak API mengikuti frontend/src/services dan frontend/src/types/api.ts (semua di bawah /api).

Frontend hasil build (frontend/dist) ikut disajikan dari sini, jadi satu proses cukup untuk demo.
"""
import asyncio
import json
import time
from datetime import datetime, timedelta
from pathlib import Path

import jwt
from fastapi import (APIRouter, BackgroundTasks, Depends, FastAPI, File, Header, HTTPException, Query, UploadFile,
                     WebSocket, WebSocketDisconnect)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import db, rag, rbac, settings
from .config import CFG, MEDIA_DIR, ROOT, SECRET, SOP_DIR

app = FastAPI(title="K3Guard AI")
app.add_middleware(CORSMiddleware, allow_methods=["*"], allow_headers=["*"],
                   allow_origins=[f"http://{h}:{p}" for h in ("localhost", "127.0.0.1") for p in (5173, 4173, 8000)])
api = APIRouter(prefix="/api")
PIPE = None  # diisi run.py


@app.on_event("startup")
def _startup():
    db.init()
    settings.apply(settings.load())
    rag.reload_index()
    rag.warmup()
    # privasi: hapus cuplikan lebih tua dari masa simpan
    cutoff = time.time() - CFG["media_retention_days"] * 86400
    for p in MEDIA_DIR.glob("*.jpg"):
        if p.stat().st_mtime < cutoff:
            p.unlink(missing_ok=True)


# ---- auth
def _decode(raw):
    try:
        return jwt.decode(raw, SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Token tidak valid, silakan login ulang")


def _user(authorization: str = Header(None), token: str = Query(None)):
    return _decode(token or (authorization or "").removeprefix("Bearer ").strip())


def need(perm):
    def dep(u=Depends(_user)):
        if not rbac.can(u["role"], perm):
            raise HTTPException(403, "Anda tidak memiliki izin untuk aksi ini")
        return u
    return dep


class Login(BaseModel):
    username: str
    password: str


@api.post("/auth/login")
def login(b: Login):
    u = db.check_password(b.username, b.password)
    if not u:
        raise HTTPException(401, "Username atau password salah")
    tok = jwt.encode({"sub": str(u["id"]), "uid": u["id"], "role": u["role"], "nama": u["nama"],
                      "exp": datetime.utcnow() + timedelta(hours=12)}, SECRET, algorithm="HS256")
    return {"access_token": tok, "token_type": "bearer", "role": u["role"], "nama": u["nama"]}


@api.get("/auth/me")
def me(u=Depends(_user)):
    row = db.q("SELECT id, nama, email, role, created_at FROM users WHERE id=?", (u["uid"],), one=True)
    if not row:
        raise HTTPException(401, "Akun tidak ditemukan")
    row["permissions"] = sorted(rbac.PERMISSIONS.get(row["role"], ()))
    return row


# ---- chatbot
class Chat(BaseModel):
    session_id: str
    pertanyaan: str


@api.post("/chat")
def chat(b: Chat, u=Depends(need("chat.ask"))):
    question = b.pertanyaan.strip()[:2000]
    if not question:
        raise HTTPException(400, "Pertanyaan kosong")
    past = db.q("SELECT pertanyaan, jawaban FROM chat_logs WHERE session_id=? ORDER BY id DESC LIMIT 6", (b.session_id,))
    history = [{"q": r["pertanyaan"], "a": r["jawaban"]} for r in reversed(past)]
    r = rag.answer(question, b.session_id, u["uid"], history)
    sumber = "; ".join(dict.fromkeys(f"{s['doc']} ({s['section']})" for s in r["sources"]))
    return {"jawaban": r["answer"], "sumber": sumber if rbac.can(u["role"], "chat.sources") else "", "session_id": b.session_id}  # mahasiswa tidak melihat sumber


@api.get("/chat/unanswered")
def unanswered(u=Depends(need("chat.unanswered"))):
    rows = db.q("SELECT id, pertanyaan, created_at, session_id, user_id FROM chat_logs WHERE answered=0 ORDER BY id DESC LIMIT 500")
    return {"items": [{**r, "answered": False} for r in rows], "total": len(rows)}


# ---- area & aturan
def _area(a):
    a["rules"] = [{"id": r["id"], "attribute": r["attribute"], "required": bool(r["required"])}
                  for r in db.q("SELECT id, attribute, required FROM area_rules WHERE area_id=? ORDER BY id", (a["id"],))]
    return a


class AreaCreate(BaseModel):
    nama: str
    deskripsi: str = ""


class RuleUpdate(BaseModel):
    attribute: str
    required: bool


@api.get("/areas")
def areas(u=Depends(need("area.read"))):
    return [_area(a) for a in db.q("SELECT * FROM areas ORDER BY id")]


@api.post("/areas")
def area_create(b: AreaCreate, u=Depends(need("area.manage"))):
    if not b.nama.strip():
        raise HTTPException(400, "Nama area wajib diisi")
    aid = db.ex("INSERT INTO areas(nama,deskripsi) VALUES(?,?)", (b.nama.strip(), b.deskripsi.strip()))
    for attr in ("head", "body", "legs", "feet"):
        db.ex("INSERT INTO area_rules(area_id,attribute,required) VALUES(?,?,0)", (aid, attr))
    return _area(db.q("SELECT * FROM areas WHERE id=?", (aid,), one=True))


@api.put("/areas/{area_id}/rules")
def put_rules(area_id: int, rules: list[RuleUpdate], u=Depends(need("area.manage"))):
    if not db.q("SELECT 1 FROM areas WHERE id=?", (area_id,), one=True):
        raise HTTPException(404, "Area tidak ditemukan")
    for r in rules:
        if r.attribute not in ("head", "body", "legs", "feet"):
            raise HTTPException(400, f"atribut tidak dikenal: {r.attribute}")
        db.ex("INSERT INTO area_rules(area_id,attribute,required) VALUES(?,?,?) "
              "ON CONFLICT(area_id,attribute) DO UPDATE SET required=excluded.required", (area_id, r.attribute, int(r.required)))
    return _area(db.q("SELECT * FROM areas WHERE id=?", (area_id,), one=True))["rules"]


class Thresholds(BaseModel):
    confidence_threshold: float | None = None
    fall_sensitivity: float | None = None
    notification_cooldown_seconds: int | None = None
    max_concurrent_streams: int | None = None
    telegram_bot_token: str | None = None
    telegram_chat_id: str | None = None


@api.get("/settings/thresholds")
def get_thresholds(u=Depends(need("settings.manage"))):
    return settings.current()


@api.put("/settings/thresholds")
def put_thresholds(b: Thresholds, u=Depends(need("settings.manage"))):
    return settings.save(b.model_dump())


# ---- SOP
_INDEX = {"antri": "pending", "indexing": "processing", "selesai": "indexed", "gagal": "failed"}


def _sop(d):
    st = (d.get("status_index") or "").split(" ")[0].rstrip(":")
    return {"id": d["id"], "nama_file": d["nama_file"], "versi": str(d["versi"]), "uploaded_by": d["uploaded_by"],
            "uploaded_at": d["uploaded_at"], "status_index": _INDEX.get(st, st)}


@api.get("/sop")
def sop_list(u=Depends(need("sop.read"))):
    return [_sop(d) for d in db.q("SELECT * FROM sop_documents ORDER BY nama_file")]


@api.get("/sop/{doc_id}/download")
def sop_download(doc_id: int, u=Depends(need("sop.read"))):
    d = db.q("SELECT * FROM sop_documents WHERE id=?", (doc_id,), one=True)
    if not d or not Path(d["file_path"]).exists():
        raise HTTPException(404, "Dokumen tidak ditemukan")
    return FileResponse(d["file_path"], filename=d["nama_file"])


@api.post("/sop")
def sop_upload(bg: BackgroundTasks, file: UploadFile = File(...), versi: str = "", u=Depends(need("sop.manage"))):
    name = Path(file.filename or "").name
    if Path(name).suffix.lower() not in (".pdf", ".docx", ".txt"):
        raise HTTPException(400, "Format harus PDF, DOCX, atau TXT")
    old = db.q("SELECT * FROM sop_documents WHERE nama_file=?", (name,), one=True)
    auto = (int(old["versi"]) + 1) if old and str(old["versi"]).isdigit() else 1
    label = versi.strip() or str(auto)
    path = SOP_DIR / f"{int(time.time())}_{name}"
    path.write_bytes(file.file.read())
    if old:  # nama sama = versi baru, chunk lama diganti
        Path(old["file_path"]).unlink(missing_ok=True)
        db.ex("UPDATE sop_documents SET versi=?, uploaded_by=?, uploaded_at=?, status_index='antri', file_path=? "
              "WHERE id=?", (label, u["uid"], db.now(), str(path), old["id"]))
        doc_id = old["id"]
    else:
        doc_id = db.ex("INSERT INTO sop_documents(nama_file,versi,uploaded_by,uploaded_at,status_index,file_path) "
                       "VALUES(?,?,?,?,?,?)", (name, label, u["uid"], db.now(), "antri", str(path)))
    bg.add_task(rag.index_document, doc_id)
    return _sop(db.q("SELECT * FROM sop_documents WHERE id=?", (doc_id,), one=True))


@api.put("/sop/{doc_id}")
def sop_update(doc_id: int, bg: BackgroundTasks, file: UploadFile = File(...), versi: str = "", u=Depends(need("sop.manage"))):
    """Ganti isi dokumen (nama dokumen tetap), versi naik otomatis bila angka, lalu di-index ulang."""
    old = db.q("SELECT * FROM sop_documents WHERE id=?", (doc_id,), one=True)
    if not old:
        raise HTTPException(404, "Dokumen tidak ditemukan")
    name = Path(file.filename or "").name
    if Path(name).suffix.lower() not in (".pdf", ".docx", ".txt"):
        raise HTTPException(400, "Format harus PDF, DOCX, atau TXT")
    label = versi.strip() or (str(int(old["versi"]) + 1) if str(old["versi"]).isdigit() else old["versi"])
    path = SOP_DIR / f"{int(time.time())}_{name}"
    path.write_bytes(file.file.read())
    Path(old["file_path"]).unlink(missing_ok=True)
    db.ex("UPDATE sop_documents SET versi=?, uploaded_by=?, uploaded_at=?, status_index='antri', file_path=? WHERE id=?",
          (label, u["uid"], db.now(), str(path), doc_id))
    bg.add_task(rag.index_document, doc_id)
    return _sop(db.q("SELECT * FROM sop_documents WHERE id=?", (doc_id,), one=True))


@api.delete("/sop/{doc_id}")
def sop_delete(doc_id: int, u=Depends(need("sop.manage"))):
    d = db.q("SELECT * FROM sop_documents WHERE id=?", (doc_id,), one=True)
    if not d:
        raise HTTPException(404, "Dokumen tidak ditemukan")
    db.ex("DELETE FROM sop_chunks WHERE doc_id=?", (doc_id,))
    db.ex("DELETE FROM sop_documents WHERE id=?", (doc_id,))
    Path(d["file_path"]).unlink(missing_ok=True)
    rag.reload_index()
    return {"ok": True}


@api.post("/sop/reindex")
def sop_reindex(bg: BackgroundTasks, u=Depends(need("sop.manage"))):
    for d in db.q("SELECT id FROM sop_documents"):
        bg.add_task(rag.index_document, d["id"])
    return {"ok": True}


# ---- pemantauan
def _camera_online():
    return PIPE is not None and PIPE.running and PIPE.status.get("camera") == "aktif"


@api.get("/status")
def status(u=Depends(need("monitoring.view"))):  # mahasiswa juga boleh melihat live
    st = PIPE.status if PIPE else {}
    online = _camera_online()
    cams = [{"id": c["id"], "nama": c["nama"], "area_id": c["area_id"], "source": c["source"],
             "aktif": online and c["id"] == PIPE.cam_id} for c in db.q("SELECT * FROM cameras ORDER BY id")]
    persons = []
    for p in st.get("persons", []):
        label = {"OK": "sesuai", "VIOLATION": "tidak sesuai", "UNVERIFIED": "belum terlihat"}
        detail = ", ".join(f"{k}: {label.get(v, v)}" for k, v in p.get("attributes", {}).items())
        if p.get("fall_state", "NORMAL") != "NORMAL":
            detail = f"Pose: {p['fall_state']}"
        persons.append({"track_id": str(p["track_id"]), "status": p["status"], "detail": detail, "attributes": p.get("attrs", {})})
    return {"yolo_model": "ready" if str(st.get("model", "")).startswith("aktif") else "not_configured",
            "total_cameras": len(cams), "active_cameras": sum(c["aktif"] for c in cams), "cameras": cams,
            "person_statuses": persons, "fps": st.get("fps", 0.0)}


@api.post("/monitoring/stream/{camera_id}/start")
def stream_start(camera_id: int, u=Depends(need("stream.control"))):
    if PIPE is None:
        raise HTTPException(503, "Pipeline kamera tidak dijalankan (run.py --no-camera)")
    PIPE.start()
    return {"status": "running", "detail": "Kamera dinyalakan. Gambar muncul setelah model selesai dimuat."}


@api.post("/monitoring/stream/{camera_id}/stop")
def stream_stop(camera_id: int, u=Depends(need("stream.control"))):
    if PIPE is None:
        raise HTTPException(503, "Pipeline kamera tidak dijalankan (run.py --no-camera)")
    PIPE.stop()
    return {"status": "stopped"}


@api.get("/frame/{camera_id}")
def frame(camera_id: int, u=Depends(need("monitoring.view"))):
    """Satu frame JPEG terbaru. Frontend memanggilnya berulang, lebih andal daripada MJPEG panjang."""
    from fastapi.responses import Response
    if PIPE is None or PIPE.jpeg is None:
        raise HTTPException(503, "Belum ada frame")
    return Response(PIPE.jpeg, media_type="image/jpeg", headers={"Cache-Control": "no-store"})


@api.get("/stream/{camera_id}")
def stream(camera_id: int, u=Depends(need("monitoring.view"))):
    if PIPE is None:
        raise HTTPException(503, "Pipeline kamera tidak berjalan")

    def gen():
        last = None
        while PIPE.running:
            j = PIPE.jpeg
            if j is not None and j is not last:
                last = j
                yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + j + b"\r\n"
            time.sleep(0.05)

    return StreamingResponse(gen(), media_type="multipart/x-mixed-replace; boundary=frame")


# ---- kejadian
_V_OUT = {"true": "verified", "false_alarm": "dismissed", "pending": "pending"}
_V_IN = {"verified": "true", "dismissed": "false_alarm", "pending": "pending"}


def _summary(e):
    d = json.loads(e["detail"] or "{}")
    if e["type"] == "fall_detected":
        return f"Terindikasi seseorang terjatuh. Mohon verifikasi langsung di lokasi. (sumber: {d.get('source', '-')})"
    return "; ".join(d.get("findings", [])) or "-"


def _event(e):
    return {"id": e["id"], "type": e["type"], "area_id": e["area_id"], "camera_id": e["camera_id"],
            "track_id": None if e["track_id"] is None else str(e["track_id"]), "detail": _summary(e),
            "confidence": e["confidence"] or 0.0, "created_at": e["created_at"],
            "verification": _V_OUT.get(e["verification"], e["verification"])}


@api.get("/events")
def events(page: int = 1, size: int = 50, type: str = None, area_id: int = None, verification: str = None,
           since_id: int = 0, u=Depends(need("event.view"))):
    sql, args = "SELECT * FROM events WHERE id>?", [since_id]
    for col, val in (("type", type), ("area_id", area_id), ("verification", _V_IN.get(verification, verification))):
        if val not in (None, ""):
            sql += f" AND {col}=?"
            args.append(val)
    size = max(1, min(size, 500))
    sql += " ORDER BY id DESC LIMIT ? OFFSET ?"
    args += [size, (max(page, 1) - 1) * size]
    return [_event(e) for e in db.q(sql, args)]


@api.get("/events/{event_id}")
def event(event_id: int, u=Depends(need("event.view"))):
    e = db.q("SELECT * FROM events WHERE id=?", (event_id,), one=True)
    if not e:
        raise HTTPException(404, "Kejadian tidak ditemukan")
    out = _event(e)
    out.update(verified_by=e["verified_by"], verified_at=e["verified_at"], follow_up_note=e["follow_up_note"] or "",
               media=[{"id": m["id"], "file_path": Path(m["file_path"]).name, "created_at": m["created_at"]}
                      for m in db.q("SELECT * FROM event_media WHERE event_id=? ORDER BY id", (event_id,))])
    return out


@app.get("/storage/{name}")
def storage(name: str, u=Depends(need("event.view"))):
    """Cuplikan kejadian (frontend memanggil /storage/<nama-file>?token=...). Hanya isi folder media."""
    p = MEDIA_DIR / Path(name).name
    if not p.is_file():
        raise HTTPException(404, "Cuplikan tidak ada (mungkin sudah lewat masa simpan)")
    return FileResponse(p)


class Verify(BaseModel):
    verification: str


@api.patch("/events/{event_id}/verify")
def verify(event_id: int, b: Verify, u=Depends(need("event.verify"))):
    if b.verification not in _V_IN:
        raise HTTPException(400, "verification harus verified / dismissed / pending")
    db.ex("UPDATE events SET verification=?, verified_by=?, verified_at=? WHERE id=?",
          (_V_IN[b.verification], u["uid"], db.now(), event_id))
    return event(event_id, u)


class Note(BaseModel):
    follow_up_note: str


@api.patch("/events/{event_id}/note")
def note(event_id: int, b: Note, u=Depends(need("event.verify"))):
    db.ex("UPDATE events SET follow_up_note=? WHERE id=?", (b.follow_up_note, event_id))
    return event(event_id, u)


@api.get("/stats")
def stats(u=Depends(need("stats.view"))):
    by_v = {r["verification"]: r["n"] for r in db.q("SELECT verification, COUNT(*) n FROM events GROUP BY verification")}
    by_type = {r["type"]: r["n"] for r in db.q(
        "SELECT type, COUNT(*) n FROM events WHERE verification!='false_alarm' GROUP BY type")}
    today = db.q("SELECT COUNT(*) n FROM events WHERE created_at>=?", (datetime.now().strftime("%Y-%m-%d"),), one=True)["n"]
    return {"total_events": sum(by_v.values()), "pending_events": by_v.get("pending", 0),
            "verified_events": by_v.get("true", 0), "dismissed_events": by_v.get("false_alarm", 0),
            "events_by_type": by_type, "events_today": today,
            "active_cameras": 1 if _camera_online() else 0,
            "total_areas": db.q("SELECT COUNT(*) n FROM areas", one=True)["n"]}


# ---- notifikasi real-time ke petugas: server memantau tabel events lalu mendorong yang baru
@api.websocket("/ws/notifications")
async def ws_notifications(ws: WebSocket, token: str = ""):
    try:
        u = _decode(token)
    except HTTPException:
        await ws.close(code=4401)
        return
    if not rbac.can(u["role"], "notification.receive"):
        await ws.close(code=4403)
        return
    await ws.accept()
    last = (db.q("SELECT MAX(id) m FROM events", one=True) or {}).get("m") or 0
    try:
        while True:
            try:
                msg = await asyncio.wait_for(ws.receive_text(), timeout=2)
                if msg == "ping":
                    await ws.send_json({"type": "pong"})
            except asyncio.TimeoutError:
                pass
            for e in reversed(db.q("SELECT * FROM events WHERE id>? ORDER BY id DESC LIMIT 20", (last,))):
                last = max(last, e["id"])
                await ws.send_json({"type": "event", "id": e["id"], "event_type": e["type"], "detail": _summary(e)})
    except WebSocketDisconnect:
        pass


app.include_router(api)

# ---- frontend hasil build (npm run build di folder frontend)
DIST = ROOT.parent / "frontend" / "dist"
if (DIST / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        if path.startswith(("api/", "storage/")):
            raise HTTPException(404)
        f = (DIST / path).resolve()
        return FileResponse(f if f.is_file() and DIST in f.parents else DIST / "index.html")
