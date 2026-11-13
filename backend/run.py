"""Jalankan K3Guard AI: backend + dashboard + pipeline kamera.

    python run.py                          # kamera dari config.yaml
    python run.py --source video_uji.mp4   # putar ulang video uji
    python run.py --no-camera              # hanya chatbot/dashboard
"""
import argparse

import uvicorn

from k3guard import api, db

p = argparse.ArgumentParser()
p.add_argument("--source", help="0 (webcam), rtsp://..., atau path video")
p.add_argument("--no-camera", action="store_true")
p.add_argument("--host", default="127.0.0.1")
p.add_argument("--port", type=int, default=8000)
a = p.parse_args()

db.init()
if not a.no_camera:
    from k3guard.pipeline import Pipeline
    api.PIPE = Pipeline(a.source)
    api.PIPE.start()
print(f"Dashboard: http://{a.host}:{a.port}  (akun demo: petugask3 / 123 dan mahasiswa / 123)")
uvicorn.run(api.app, host=a.host, port=a.port)
