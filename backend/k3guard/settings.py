"""Pengaturan yang bisa diubah dari dashboard. Disimpan di data/settings.json, langsung diterapkan ke CFG (tanpa restart)."""
import json

from .config import CFG, DATA_DIR, TELEGRAM_CHAT_ID, TELEGRAM_TOKEN

FILE = DATA_DIR / "settings.json"


def load():
    try:
        return json.loads(FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def apply(s):
    if "confidence_threshold" in s:
        CFG["conf"]["default"] = float(s["confidence_threshold"])
    if "notification_cooldown_seconds" in s:
        CFG["ppe"]["cooldown_seconds"] = CFG["fall"]["cooldown_seconds"] = int(s["notification_cooldown_seconds"])
    if "fall_sensitivity" in s:  # makin sensitif = alarm jatuh keluar lebih cepat: 0.7 -> 3 dtk (nilai awal PRD), 0.95 -> 2 dtk
        CFG["fall"]["alert_seconds"] = max(1, round(6 - 4 * float(s["fall_sensitivity"])))


def current():
    s = load()
    return {
        "confidence_threshold": CFG["conf"]["default"],
        "fall_sensitivity": s.get("fall_sensitivity", 0.7),
        "notification_cooldown_seconds": CFG["ppe"]["cooldown_seconds"],
        "max_concurrent_streams": s.get("max_concurrent_streams", 1),  # tersimpan saja: sistem ini satu kamera
        "telegram_chat_id": s.get("telegram_chat_id") or TELEGRAM_CHAT_ID,
        "telegram_configured": bool((s.get("telegram_bot_token") or TELEGRAM_TOKEN) and (s.get("telegram_chat_id") or TELEGRAM_CHAT_ID)),
    }


def save(patch):
    s = load()
    s.update({k: v for k, v in patch.items() if v not in (None, "")})
    FILE.write_text(json.dumps(s, indent=2), encoding="utf-8")
    apply(s)
    return current()


def telegram():
    s = load()
    return s.get("telegram_bot_token") or TELEGRAM_TOKEN, s.get("telegram_chat_id") or TELEGRAM_CHAT_ID
