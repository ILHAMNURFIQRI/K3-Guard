"""Uji deteksi kamera saja, tanpa dashboard. Tekan q di jendela video untuk keluar.

    python test_camera.py                 # webcam 0
    python test_camera.py --source 1      # webcam lain
    python test_camera.py --source video_uji.mp4

Catatan: pipeline tetap mencatat kejadian ke data/k3guard.db (sama seperti run.py).
"""
import argparse
import time

import cv2
import numpy as np

from k3guard import db
from k3guard.pipeline import Pipeline

p = argparse.ArgumentParser()
p.add_argument("--source")
a = p.parse_args()

db.init()
pipe = Pipeline(a.source)
pipe.start()
last = None
while True:
    if pipe.jpeg is not None and pipe.jpeg is not last:
        last = pipe.jpeg
        cv2.imshow("K3Guard - tekan q untuk keluar", cv2.imdecode(np.frombuffer(last, np.uint8), cv2.IMREAD_COLOR))
    if cv2.waitKey(30) & 0xFF == ord("q"):
        break
    if int(time.time()) % 3 == 0:
        print(f"\rkamera={pipe.status['camera']} model={pipe.status['model']} fps={pipe.status['fps']} orang={len(pipe.status['persons'])}   ", end="", flush=True)
pipe.stop()
cv2.destroyAllWindows()
