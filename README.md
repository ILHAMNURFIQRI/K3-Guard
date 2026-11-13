# K3Guard AI

Prototipe sesuai `docs/PRD_K3Guard_AI.md`: deteksi perlengkapan (YOLO), deteksi jatuh (pose + kelas `person_danger`),
chatbot SOP (RAG + Claude), dashboard web dua peran, notifikasi Telegram.

## Struktur

```
backend/                 FastAPI + pipeline kamera + RAG
  run.py                 jalankan backend (sekaligus menyajikan frontend hasil build)
  config.yaml            ambang, zona, area, kamera, jalur bobot model
  requirements.txt
  test_camera.py         uji deteksi kamera tanpa dashboard
  k3guard/               kode: api.py, pipeline.py, ppe.py, fall.py, rag.py, db.py, notify.py, settings.py
  tests/                 tes logika
  data/                  dibuat otomatis: k3guard.db, media/, sop/, settings.json
ml/                      pelatihan model
  train.py               latih + evaluasi split test
  data.yaml, train/ valid/ test/   dataset Roboflow (YOLOv8)
  weights/               yolo11s.pt, yolo11n-pose.pt
  runs/detect/k3guard/weights/best.pt   hasil latihan (dipakai backend)
frontend/                React + Vite + TypeScript (Tailwind, Three.js)
docs/                    PRD
```

## Setup (Windows, GPU NVIDIA)

```powershell
py -3.12 -m venv C:\Users\<user>\.venvs\k3guard      # di luar OneDrive agar tidak ikut sync
C:\Users\<user>\.venvs\k3guard\Scripts\activate
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124
pip install -r backend\requirements.txt
cd frontend; npm install; cd ..
```

Dataset (`ml/train`, `ml/valid`, `ml/test`) dan bobot dasar tidak ikut repo. Unduh dataset YOLOv8 dari Roboflow
(`ml-k3` versi 2, lihat `ml/data.yaml`) ke folder `ml/`. Bobot hasil latihan `best.pt` disertakan di
`ml/runs/detect/k3guard/weights/`. Untuk Telegram, salin `backend/.env.example` menjadi `backend/.env`.

## Latih model (sekali saja)

```powershell
cd ml
python train.py                          # yolo11s, 100 epoch, batch 16 (RTX 3050 6GB)
python train.py --eval-only              # metrik per kelas di split test
```

## Jalankan sistem

```powershell
cd frontend; npm run build; cd ..        # sekali, dan setiap frontend berubah
cd backend
$env:ANTHROPIC_API_KEY = "sk-ant-..."    # untuk chatbot
$env:TELEGRAM_BOT_TOKEN = "..."          # opsional (atau isi dari halaman Pengaturan)
$env:TELEGRAM_CHAT_ID = "..."
python run.py                            # webcam sesuai backend/config.yaml
python run.py --source video_uji.mp4     # putar ulang video uji
python run.py --no-camera                # hanya chatbot dan dashboard
```

Buka http://127.0.0.1:8000. Mode pengembangan frontend: `cd frontend; npm run dev` (http://localhost:5173, backend tetap di port 8000).

| Peran | Username | Password |
|---|---|---|
| Petugas K3 | petugask3 | 123 |
| Mahasiswa | mahasiswa | 123 |

Tambah akun: `cd backend; python -m k3guard.db "Nama" username password student|officer`. Password `123` hanya untuk demo.

Chatbot butuh dokumen SOP: login sebagai petugas, menu Dokumen SOP, unggah PDF/DOCX/TXT.
Saat indexing pertama, model embedding (~470 MB) diunduh otomatis.

## Tes

```powershell
cd backend; python -m pytest tests -q
```

## Catatan teknis

- Kontrak API ada di `frontend/src/services` dan `frontend/src/types/api.ts`; `backend/k3guard/api.py` mengikutinya (semua di bawah `/api`).
- Video live memakai polling frame JPEG (`/api/frame/{id}`), bukan MJPEG panjang.
- Halaman Pengaturan: confidence, sensitivitas jatuh, cooldown, dan token Telegram langsung diterapkan tanpa restart
  (disimpan di `backend/data/settings.json`). "Maksimal stream paralel" hanya tersimpan karena sistem ini satu kamera.
- Person dan track_id diambil dari `yolo11n-pose` (COCO). Kelas `person_safe`/`person_danger` dari model PPE dicocokkan ke
  person lewat IoU dan dipakai sebagai sinyal `model` untuk jatuh.
- ID kelas di `ml/data.yaml` (alfabetis) berbeda dari PRD 6.1.1; kode memakai nama kelas.
- Vector store = matriks numpy di SQLite, cukup untuk SOP satu lab.
- Dataset: semua frame dari satu hari dan satu ruangan, jadi mAP test terlalu optimistis. Rekam di lokasi pemakaian
  (orang, baju, cahaya berbeda), beri label, latih ulang, dan pisahkan video untuk test.
- Belum ada di frontend: halaman live untuk mahasiswa. Backend sudah mengizinkan mahasiswa memanggil `/api/status` dan `/api/frame/{id}`.
