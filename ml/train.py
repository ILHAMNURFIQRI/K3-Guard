"""Latih model deteksi PPE (9 kelas) dari dataset Roboflow, lalu evaluasi di split test.

Contoh:
    python train.py                       # yolo11s, 100 epoch
    python train.py --model yolo11n.pt --epochs 50 --batch 8
    python train.py --eval-only           # evaluasi best.pt di split test (PRD 12.1)
"""
import argparse
from pathlib import Path

from ultralytics import YOLO

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data.yaml"  # Ultralytics menangani path "../train/images" ala Roboflow
BEST = ROOT / "runs/detect/k3guard/weights/best.pt"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--model", default=str(ROOT / "weights/yolo11s.pt"))  # tidak ada di disk = diunduh otomatis
    p.add_argument("--epochs", type=int, default=100)
    p.add_argument("--batch", type=int, default=16)  # RTX 3050 6GB aman di 16 untuk yolo11s@640
    p.add_argument("--imgsz", type=int, default=640)
    p.add_argument("--device", default="0")
    p.add_argument("--workers", type=int, default=0)  # tiap worker Windows = 1 proses penuh (~2GB); laptop RAM 12GB crash di 2+ worker
    p.add_argument("--eval-only", action="store_true")
    a = p.parse_args()

    if not a.eval_only:
        YOLO(a.model).train(
            data=str(DATA), epochs=a.epochs, batch=a.batch, imgsz=a.imgsz, device=a.device,
            project=str(ROOT / "runs/detect"), name="k3guard", exist_ok=True,
            patience=20, workers=a.workers, cache=False, plots=True,
        )

    m = YOLO(str(BEST)).val(data=str(DATA), split="test", imgsz=a.imgsz, device=a.device,
                            project=str(ROOT / "runs/detect"), name="k3guard_test", exist_ok=True)
    print(f"\nTEST mAP50={m.box.map50:.3f}  mAP50-95={m.box.map:.3f}  (target PRD: mAP50 >= 0.70)")
    for i, name in m.names.items():
        if i in m.box.ap_class_index:
            j = list(m.box.ap_class_index).index(i)
            print(f"  {name:16s} P={m.box.p[j]:.3f} R={m.box.r[j]:.3f} mAP50={m.box.ap50[j]:.3f}")


if __name__ == "__main__":
    main()
