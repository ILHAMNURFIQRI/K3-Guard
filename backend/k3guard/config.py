import os
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
MEDIA_DIR = DATA_DIR / "media"
SOP_DIR = DATA_DIR / "sop"
for d in (DATA_DIR, MEDIA_DIR, SOP_DIR):
    d.mkdir(parents=True, exist_ok=True)

CFG = yaml.safe_load((ROOT / "config.yaml").read_text(encoding="utf-8"))

# backend/.env berisi rahasia (token bot); jangan dibagikan atau di-commit
_env = ROOT / ".env"
if _env.exists():
    for _line in _env.read_text(encoding="utf-8").splitlines():
        _k, _, _v = _line.partition("=")
        if _k.strip() and not _k.startswith("#"):
            os.environ.setdefault(_k.strip(), _v.strip())

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")


def _secret():
    if os.getenv("K3GUARD_SECRET"):
        return os.environ["K3GUARD_SECRET"]
    f = DATA_DIR / ".secret"
    if not f.exists():
        f.write_text(os.urandom(32).hex())
    return f.read_text().strip()


SECRET = _secret()
