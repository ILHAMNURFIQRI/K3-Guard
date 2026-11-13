"""Notifikasi Telegram (PRD 6.5). Dashboard memakai polling /events, jadi kanal 'dashboard' cukup dicatat."""
import threading

import httpx

from . import db
from . import settings
from .config import CFG


def format_message(type_, area, waktu, findings=None):
    if type_ == "fall_detected":
        return (f"🚨 [K3Guard AI] KEADAAN DARURAT\nJenis kejadian : Orang terjatuh / berbaring (person_danger)\n"
                f"Area           : {area}\nKamera         : {CFG['camera']['name']}\nWaktu          : {waktu}\n"
                "Catatan: Mohon segera verifikasi langsung di lokasi.")
    return (f"[K3Guard AI] KETIDAKSESUAIAN PERLENGKAPAN\nArea   : {area}\nWaktu  : {waktu}\n"
            f"Temuan : {'; '.join(findings or [])}\nCatatan: Berdasarkan deteksi kamera, mohon diperiksa langsung.")


def _send(event_id, text, photo, telegram=True):
    db.ex("INSERT INTO notifications(event_id,channel,status,sent_at) VALUES(?,?,?,?)",
          (event_id, "dashboard", "sent", db.now()))
    if not telegram:  # mis. ketidaksesuaian APD: hanya dasbor, tidak ke Telegram
        return
    token, chat_id = settings.telegram()
    if not (token and chat_id):
        status = "skipped_no_token"
    else:
        try:
            with open(photo, "rb") as f:
                r = httpx.post(f"https://api.telegram.org/bot{token}/sendPhoto", timeout=15,
                               data={"chat_id": chat_id, "caption": text}, files={"photo": f})
            status = "sent" if r.status_code == 200 else f"error_{r.status_code}"
        except Exception as e:  # jaringan putus tidak boleh menghentikan pipeline
            status = f"error_{type(e).__name__}"
    db.ex("INSERT INTO notifications(event_id,channel,status,sent_at) VALUES(?,?,?,?)",
          (event_id, "telegram", status, db.now()))


def send_async(event_id, text, photo, telegram=True):
    threading.Thread(target=_send, args=(event_id, text, photo, telegram), daemon=True).start()
