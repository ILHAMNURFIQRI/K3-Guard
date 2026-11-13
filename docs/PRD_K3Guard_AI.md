# PRD – K3Guard AI (Versi Detail)

Versi: 0.4 · Tanggal: 2026-11-11 · Status: Draf MVP

Angka ambang, target akurasi, dan estimasi waktu di dokumen ini adalah nilai awal. Semuanya harus disetel ulang setelah ada hasil uji pada data lab yang sebenarnya.

---

## 1. Ringkasan Produk

K3Guard AI adalah sistem pendukung keselamatan praktikum yang menggabungkan Computer Vision dan chatbot AI. Sistem memeriksa kelengkapan perlengkapan dan pakaian praktikum mahasiswa, menjawab pertanyaan tentang SOP K3 berdasarkan dokumen resmi, dan mengirim notifikasi ke petugas K3 ketika terdeteksi indikasi jatuh.

Sistem adalah alat bantu. Sistem tidak menggantikan petugas K3, instruktur, SOP resmi, atau prosedur tanggap darurat. Setiap keputusan dan tindakan tetap dilakukan manusia.

## 2. Latar Belakang dan Masalah

1. Mahasiswa kadang melakukan praktikum tanpa perlengkapan atau pakaian yang diwajibkan, dan pemeriksaan masih bergantung pada pengawasan langsung.
2. Petugas K3 tidak bisa mengawasi seluruh area setiap saat dan butuh bantuan mengetahui ketidaksesuaian serta kejadian yang perlu perhatian.
3. SOP K3 tidak selalu mudah ditemukan atau dipahami saat dibutuhkan.
4. Kejadian seperti orang terjatuh harus sampai ke petugas secepat mungkin agar dapat diperiksa.

## 3. Tujuan, Non-Tujuan, dan Indikator Keberhasilan

### 3.1 Tujuan MVP

| ID | Tujuan |
|---|---|
| G1 | Mendeteksi person dan kelengkapan perlengkapan/pakaian praktikum pada satu area secara near real-time. |
| G2 | Menyediakan chatbot yang menjawab pertanyaan SOP hanya dari dokumen SOP yang disediakan. |
| G3 | Mendeteksi indikasi jatuh dan memberi notifikasi ke petugas K3. |
| G4 | Menyediakan dashboard untuk memantau status, menerima notifikasi, dan melihat riwayat. |
| G5 | Menghasilkan laporan evaluasi kinerja dan keterbatasan prototipe. |

### 3.2 Non-Tujuan

- Pengenalan wajah atau identifikasi biometrik mahasiswa.
- Diagnosis medis, atau pernyataan bahwa seseorang sakit, sekarat, atau meninggal.
- Deteksi Possible Sick/Distress dan Unresponsive/Critical. Ditunda ke pengembangan lanjutan karena tidak andal dari kamera biasa.
- Pemberian sanksi otomatis kepada mahasiswa.
- Menampilkan pelanggaran kepada mahasiswa yang bersangkutan (sistem tidak tahu identitas orang yang terdeteksi).
- Dukungan banyak laboratorium dan banyak kamera pada tahap awal.
- Aplikasi mobile native.

### 3.3 Indikator Keberhasilan

| Indikator | Target awal |
|---|---|
| mAP50 model deteksi perlengkapan | ≥ 0,70 |
| Recall fall detection pada video uji | ≥ 80% |
| False alarm fall detection | Dilaporkan per jam; target ≤ 2 per jam pada video aktivitas normal |
| Waktu dari kondisi jatuh memenuhi aturan sampai notifikasi terkirim | ≤ 10 detik |
| Jawaban chatbot sesuai SOP pada pertanyaan uji | ≥ 80% |
| Pertanyaan di luar cakupan SOP yang ditolak dengan benar | 100% tidak dijawab dengan karangan |
| Demo end-to-end semua alur wajib | Berjalan dalam satu sesi demo |

## 4. Pengguna dan Skenario

### 4.1 Peran

| Peran | Deskripsi | Hak akses |
|---|---|---|
| Mahasiswa | Peserta praktikum. | Chatbot SOP, halaman informasi perlengkapan wajib, membaca dokumen SOP (hanya lihat), tombol hubungi petugas. Tidak boleh melihat video kamera, foto kejadian, atau riwayat kejadian. |
| Petugas K3 | Memantau, mengelola, dan menindaklanjuti. | Semua yang dimiliki mahasiswa, ditambah: pemantauan live, notifikasi, laporan pelanggaran dengan foto, verifikasi kejadian, kelola SOP, statistik, aturan area, dan (tahap lanjut) kelola akun. |

Hanya ada dua peran. Fungsi admin dilebur ke Petugas K3.

### 4.2 User Story

| ID | Sebagai | Saya ingin | Agar |
|---|---|---|---|
| US-1 | Petugas K3 | melihat status kepatuhan tiap orang di area secara langsung | tahu siapa yang perlu ditegur. |
| US-2 | Petugas K3 | menerima notifikasi saat ada ketidaksesuaian yang bertahan | tidak perlu memantau layar terus-menerus. |
| US-3 | Petugas K3 | menerima notifikasi dengan cuplikan gambar saat ada indikasi jatuh | bisa segera memeriksa dan menindaklanjuti. |
| US-4 | Petugas K3 | menandai kejadian sebagai benar atau false alarm | kualitas sistem dapat dievaluasi. |
| US-5 | Petugas K3 | melihat dan memfilter riwayat kejadian | dapat membuat rekap kepatuhan. |
| US-6 | Mahasiswa | bertanya tentang SOP lewat chat | memahami prosedur tanpa mencari dokumen. |
| US-7 | Mahasiswa | melihat perlengkapan yang wajib di area praktikum | datang dengan persiapan yang benar. |
| US-8 | Petugas K3 | mengatur perlengkapan wajib per area | aturan sesuai SOP laboratorium. |
| US-9 | Petugas K3 | mengunggah, memperbarui, dan menghapus dokumen SOP | chatbot selalu merujuk dokumen terbaru. |
| US-10 | Petugas K3 | membuka laporan pelanggaran (mis. tanpa helm) lengkap dengan foto, waktu, dan area | bukti visualnya jelas untuk ditindaklanjuti. |
| US-11 | Petugas K3 | melihat grafik pelanggaran per hari, jenis perlengkapan, dan area | tahu pola ketidakpatuhan. |
| US-12 | Petugas K3 | melihat pertanyaan chatbot yang tidak terjawab | tahu SOP apa yang perlu ditambahkan. |
| US-13 | Petugas K3 | menambahkan catatan tindak lanjut pada kejadian | ada rekam penanganan. |
| US-14 | Mahasiswa | membaca dokumen SOP dan daftar perlengkapan wajib per area | siap sebelum praktikum. |
| US-15 | Mahasiswa | menghubungi petugas K3 dengan cepat | bisa melapor atau meminta bantuan. |
| US-16 | Mahasiswa | melaporkan bahaya atau insiden secara manual dengan foto (tahap lanjut) | petugas mengetahui kondisi yang tidak tertangkap kamera. |
| US-17 | Mahasiswa | cek mandiri dengan foto diri sebelum masuk (tahap lanjut) | tahu kekurangan perlengkapan lebih dulu. |

## 5. Ruang Lingkup MVP

- Satu laboratorium, satu area praktikum, satu kamera utama (webcam, IP camera, atau file video untuk demo).
- Deteksi perlengkapan dengan model YOLO (kelas pada bagian 6.1).
- Fall detection berbasis pose dan aturan (bagian 6.3).
- Chatbot RAG berbasis dokumen SOP yang disediakan.
- Dashboard web, notifikasi lewat dashboard dan bot Telegram.

## 6. Spesifikasi Fungsional

### 6.1 Modul A – Deteksi Perlengkapan dan Pakaian

#### 6.1.1 Kelas Deteksi

Nama kelas harus sama persis di Roboflow, di file `data.yaml`, dan di kode. Jangan diubah di tengah jalan.

| ID | Nama kelas | Arti | Dilabel pada |
|---|---|---|---|
| 0 | `person_safe` | Orang dalam kondisi normal/aman (berdiri, berjalan, duduk, bekerja) | Seluruh tubuh yang terlihat. |
| 1 | `person_danger` | Orang dalam kondisi berbahaya: terjatuh atau terbaring tidak wajar | Seluruh tubuh yang terlihat pada frame orang jatuh/terbaring. |
| 2 | `helmet` | Memakai helm | Helm di kepala. |
| 3 | `no_helmet` | Kepala tanpa helm | Kepala yang terlihat tanpa helm. |
| 4 | `coverall` | Baju praktikum (wearpack/jas lab sesuai ketentuan lab) | Bagian badan yang tertutup baju praktikum. |
| 5 | `no_coverall` | Badan dengan baju non-praktikum | Bagian badan yang terlihat dengan baju biasa. |
| 6 | `jeans` | Celana jeans | Bagian kaki yang memakai jeans. |
| 7 | `safety_shoes` | Sepatu safety | Sepatu di kaki. |
| 8 | `no_safety_shoes` | Sepatu biasa, sandal, atau kaki telanjang | Alas kaki yang terlihat dan bukan sepatu safety. |

Ganti arti `coverall` sesuai pakaian yang benar-benar diwajibkan lab. Definisi tiap kelas harus tertulis dalam satu dokumen pedoman pelabelan sebelum pelabelan dimulai.

Aturan pelabelan:
- Kelas `no_*` hanya dilabel pada bagian tubuh yang terlihat. Jangan menyimpulkan dari ketiadaan objek.
- Bagian tubuh yang tertutup atau terpotong dari frame tidak dilabel.
- Satu bagian tubuh hanya boleh punya satu kelas dari pasangannya.
- `person_safe` dan `person_danger` saling eksklusif untuk satu orang pada satu frame. Definisi `person_danger` (mis. terbaring di lantai, terjatuh, tergeletak) harus tertulis jelas di pedoman. Duduk, jongkok, dan membungkuk tetap `person_safe`.
- Tidak ada kelas `no_jeans`. Celana hanya bisa berstatus `OK` (jeans terdeteksi) atau `UNVERIFIED`, tidak pernah `VIOLATION` (lihat 6.1.4).
- Bounding box rapat pada objek, bukan seluruh tubuh.

#### 6.1.2 Alur Pemrosesan

1. Ambil frame dari kamera (target 5-10 FPS untuk inferensi).
2. Jalankan model YOLO, hasilnya semua bounding box dan kelasnya.
3. Lacak orang (`person_safe` atau `person_danger`) antarframe (tracker bawaan YOLO seperti ByteTrack) agar setiap orang punya `track_id`, dan kelas orang yang berganti pada `track_id` yang sama ditangani dengan voting.
4. Asosiasikan objek ke person (bagian 6.1.3).
5. Hitung status tiap person pada jendela waktu (bagian 6.1.4).
6. Bandingkan dengan aturan area (bagian 6.1.5).
7. Kirim hasil ke backend untuk ditampilkan dan dicatat.

#### 6.1.3 Asosiasi Objek ke Person

Objek hanya dikaitkan ke person (bounding box `person_safe`; orang berstatus `person_danger` tidak dinilai perlengkapannya karena posisi tubuhnya tidak berdiri dan zona tidak berlaku) jika pusat bounding box objek berada di dalam bounding box person dan di zona tubuh yang sesuai. Zona dinyatakan sebagai persentase tinggi bounding box person dari atas:

| Kelas | Zona valid (nilai awal) |
|---|---|
| `helmet`, `no_helmet` | 0–30% |
| `coverall`, `no_coverall` | 15–65% |
| `jeans` | 45–90% |
| `safety_shoes`, `no_safety_shoes` | 80–100% |

Aturan tambahan:
- Jika satu objek masuk ke beberapa person (orang berdekatan atau tumpang tindih), pilih person dengan tumpang tindih terbesar.
- Jika satu person punya pasangan kelas yang bertentangan (misalnya `helmet` dan `no_helmet`), ambil yang confidence rata-ratanya lebih tinggi pada jendela waktu.
- Jika satu orang terdeteksi sebagai `person_safe` dan `person_danger` bergantian, ambil kelas dengan confidence rata-rata lebih tinggi pada jendela waktu.
- Zona dapat disetel lagi setelah uji.

#### 6.1.4 Status per Atribut dan per Person

Status tiap atribut (kepala, badan, kaki, alas kaki) dihitung dengan voting pada jendela 15 frame terakhir:

| Status atribut | Syarat |
|---|---|
| `OK` | Kelas positif (`helmet`, `coverall`, `jeans`, `safety_shoes`) terdeteksi di ≥ 60% frame jendela. |
| `VIOLATION` | Kelas negatif (`no_*`) terdeteksi di ≥ 60% frame jendela. |
| `UNVERIFIED` | Tidak memenuhi dua syarat di atas (tertutup, terpotong, terlalu jauh, atau tidak stabil). |

Status person:
- `COMPLIANT`: semua atribut wajib berstatus `OK`.
- `NON_COMPLIANT`: minimal satu atribut wajib berstatus `VIOLATION`.
- `UNVERIFIED`: tidak ada `VIOLATION` tetapi ada atribut wajib `UNVERIFIED`.

Sistem tidak pernah menuliskan "tidak memakai" untuk status `UNVERIFIED`. Teks yang dipakai adalah "belum dapat diverifikasi".

Karena tidak ada kelas `no_jeans`, atribut kaki (celana) hanya bisa `OK` atau `UNVERIFIED`. Celana yang bukan jeans tidak akan dilaporkan sebagai pelanggaran oleh sistem. Jika lab ingin mendeteksinya, tambahkan kelas `no_jeans` (lihat pertanyaan terbuka).

#### 6.1.5 Aturan Area

Tiap area punya daftar atribut wajib yang dapat diatur petugas K3. Contoh: area bengkel mesin mewajibkan kepala, badan, kaki, dan alas kaki. Area lain mungkin hanya mewajibkan alas kaki.

#### 6.1.6 Pencatatan Kejadian

- Kejadian `ppe_violation` dicatat ketika person berstatus `NON_COMPLIANT` terus-menerus ≥ 5 detik (nilai awal).
- Satu `track_id` dengan pelanggaran yang sama tidak dicatat ulang selama 60 detik (cooldown).
- Setiap kejadian menyimpan: waktu, area, kamera, `track_id`, atribut yang melanggar, skor confidence rata-rata, dan satu cuplikan gambar.

#### 6.1.7 Kebutuhan Modul A

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FA-1 | Membaca stream dari webcam, IP camera (RTSP), atau file video. | Wajib |
| FA-2 | Mendeteksi kesembilan kelas pada 6.1.1. | Wajib |
| FA-3 | Melacak person dan memberi `track_id`. | Wajib |
| FA-4 | Mengasosiasikan objek ke person sesuai 6.1.3. | Wajib |
| FA-5 | Menghitung status atribut dan status person sesuai 6.1.4. | Wajib |
| FA-6 | Mengevaluasi status terhadap aturan area. | Wajib |
| FA-7 | Mencatat kejadian `ppe_violation` sesuai 6.1.6. | Wajib |
| FA-8 | Menampilkan bounding box dan status di video dashboard. | Wajib |
| FA-9 | Ambang confidence per kelas dapat dikonfigurasi. | Disarankan |

### 6.2 Modul B – Chatbot SOP (RAG)

#### 6.2.1 Pipeline

1. **Ingest:** petugas K3 mengunggah dokumen SOP (PDF/DOCX/TXT). Sistem mengekstrak teks, memecah menjadi potongan (chunk) ±500-800 token dengan tumpang tindih ±100 token, mempertahankan metadata (nama dokumen, bab/halaman).
2. **Index:** setiap chunk diberi embedding dan disimpan di vector store (Chroma atau FAISS).
3. **Retrieve:** pertanyaan pengguna diberi embedding, lalu diambil k chunk teratas (nilai awal k = 4).
4. **Cek relevansi:** jika skor kemiripan chunk teratas di bawah ambang, sistem menjawab tidak tahu tanpa memanggil LLM untuk mengarang.
5. **Generate:** LLM diberi pertanyaan dan chunk terambil dengan instruksi: jawab hanya dari konteks, sebutkan sumber, nyatakan jika tidak cukup informasi.
6. **Output:** jawaban, daftar sumber (dokumen dan bagian), disclaimer bila relevan.

#### 6.2.2 Perilaku yang Diwajibkan

- Menjawab dalam Bahasa Indonesia.
- Menampilkan sumber setiap jawaban.
- Jika informasi tidak ada atau tidak jelas: "Informasi ini tidak ditemukan pada SOP yang tersedia. Silakan hubungi petugas K3 atau instruktur."
- Tidak mengarang prosedur, nilai, atau langkah keselamatan.
- Jika pertanyaan menyiratkan keadaan darurat nyata (misalnya "ada yang pingsan sekarang"), jawaban diawali pengingat: segera hubungi petugas K3 dan ikuti prosedur darurat resmi, baru kemudian merujuk langkah awal dari SOP bila ada.
- Pertanyaan di luar topik K3/SOP ditolak dengan sopan.

#### 6.2.3 Kebutuhan Modul B

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FB-1 | Unggah dokumen SOP dan lakukan indexing ulang. | Wajib |
| FB-2 | Antarmuka chat dengan riwayat percakapan dalam sesi. | Wajib |
| FB-3 | Retrieval dan generasi sesuai 6.2.1. | Wajib |
| FB-4 | Tampilkan sumber pada setiap jawaban. | Wajib |
| FB-5 | Mekanisme tidak tahu sesuai 6.2.2. | Wajib |
| FB-6 | Penanganan pertanyaan darurat sesuai 6.2.2. | Wajib |
| FB-7 | Log pertanyaan dan jawaban untuk evaluasi. | Disarankan |
| FB-8 | Tombol umpan balik "jawaban membantu / tidak". | Opsional |

### 6.3 Modul C – Deteksi Jatuh

#### 6.3.1 Pendekatan

Fall detection memakai dua sinyal yang berjalan bersama:
1. **Model:** kelas `person_danger` dari model YOLO yang sama dengan Modul A (orang terjatuh atau terbaring).
2. **Pose:** pose estimation (YOLO-pose atau MediaPipe) dengan aturan berbasis waktu.

Pose diambil dari orang yang sama yang dilacak pada Modul A. Tidak ada model terpisah untuk jatuh. Dua sinyal dipakai agar saling mengisi: model menangkap pola visual terbaring, pose menangkap gerakan jatuh dari waktu ke waktu.

#### 6.3.2 Fitur yang Dihitung per Frame

| Fitur | Definisi |
|---|---|
| Sudut badan | Sudut garis tengah bahu ke pinggul terhadap sumbu vertikal. Mendekati 0° saat berdiri, mendekati 90° saat berbaring. |
| Rasio bounding box | Lebar dibagi tinggi bounding box person. Naik saat berbaring. |
| Ketinggian pinggul | Posisi vertikal titik pinggul relatif terhadap tinggi person saat berdiri. |
| Kecepatan turun | Perubahan ketinggian pinggul per detik. |

#### 6.3.3 Mesin Status (nilai awal, disetel setelah uji)

| Status | Syarat masuk |
|---|---|
| `NORMAL` | Kondisi awal. |
| `FALLING` | Kecepatan turun pinggul melebihi ambang dalam ≤ 1 detik, atau sudut badan melonjak dari < 30° ke > 60° dalam ≤ 1 detik. |
| `LYING` | Dari `FALLING`, sudut badan > 60° dan rasio bounding box > 1,0 secara terus-menerus. |
| `ALERT` | `LYING` bertahan ≥ 3 detik tanpa kembali ke posisi berdiri atau duduk. |

Kembali ke `NORMAL` jika sudut badan < 40° selama ≥ 1 detik.

**Sumber pemicu `ALERT`:** alarm berbunyi jika salah satu terpenuhi, dan sumbernya dicatat pada kejadian (`source`).
- `pose`: mesin status di atas mencapai `ALERT`.
- `model`: `person_danger` terdeteksi di ≥ 60% frame pada jendela ≥ 3 detik untuk `track_id` yang sama.
- `both`: kedua syarat terpenuhi (keyakinan tertinggi).

Evaluasi menghitung metrik terpisah untuk tiap sumber. Jika `model` atau `pose` sendirian terlalu banyak false alarm, ubah menjadi syarat `both` saja.

Aturan pengurang false alarm:
- Duduk, jongkok, dan membungkuk tidak memicu `FALLING` karena pinggul tidak turun mendadak ke level lantai dan sudut badan tidak melampaui ambang.
- Syarat bertahan ≥ 3 detik pada `LYING` menyaring gerakan cepat yang kembali berdiri.
- Cooldown 60 detik per `track_id` setelah `ALERT`.
- Bila keypoint tidak cukup terlihat (kepercayaan keypoint rendah), status tidak naik ke `ALERT`; sistem mencatat "pose tidak terverifikasi".

#### 6.3.4 Notifikasi

Saat status `ALERT`:
1. Buat kejadian `fall_detected` di database.
2. Simpan 1-3 cuplikan gambar (momen awal jatuh dan saat `ALERT`).
3. Kirim notifikasi ke dashboard dan Telegram dengan format pada 6.5.

Teks notifikasi tidak boleh memuat kata diagnosis. Pakai: "Terindikasi seseorang terjatuh. Mohon verifikasi langsung di lokasi."

#### 6.3.5 Kebutuhan Modul C

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FC-1 | Estimasi pose dari person yang dilacak. | Wajib |
| FC-2 | Hitung fitur 6.3.2 dan jalankan mesin status 6.3.3. | Wajib |
| FC-3 | Pencatatan kejadian dan penyimpanan cuplikan. | Wajib |
| FC-4 | Notifikasi sesuai 6.3.4. | Wajib |
| FC-5 | Verifikasi petugas: tandai `Benar` atau `False Alarm`. | Wajib |
| FC-6 | Ambang dapat dikonfigurasi lewat file konfigurasi. | Disarankan |
| FC-7 | Mode "putar ulang video uji" untuk demo dan evaluasi. | Disarankan |
| FC-8 | Gabungkan sinyal kelas `person_danger` dan pose, catat `source` (`model`/`pose`/`both`) pada kejadian. | Wajib |

### 6.4 Backend dan Dashboard

#### 6.4.1 Halaman Dashboard

| Halaman | Isi |
|---|---|
| Halaman | Peran | Isi |
|---|---|---|
| Login | Semua | Autentikasi; setelah masuk diarahkan sesuai peran. |
| Chatbot | Mahasiswa, Petugas | Antarmuka chat SOP. |
| Informasi Perlengkapan | Mahasiswa, Petugas | Daftar perlengkapan wajib per area. |
| Dokumen SOP | Mahasiswa (lihat), Petugas (lihat dan kelola) | Daftar dan isi dokumen SOP. Petugas dapat unggah, perbarui, hapus, dan memicu indexing ulang. |
| Hubungi Petugas | Mahasiswa | Kontak petugas K3 (nomor atau tautan Telegram). |
| Pemantauan Live | Petugas | Video langsung dengan bounding box, status tiap person, status kamera, panel notifikasi terbaru. |
| Laporan Pelanggaran | Petugas | Tabel kejadian `ppe_violation` dan `fall_detected` dengan filter tanggal, jenis, area, status verifikasi. Detail memuat foto bukti (mis. kepala tanpa helm dengan kotak deteksi), waktu, area, confidence, dan catatan tindak lanjut. |
| Statistik | Petugas | Grafik pelanggaran per hari, per jenis perlengkapan, dan per area. |
| Pertanyaan Tak Terjawab | Petugas | Daftar pertanyaan chatbot yang dijawab "tidak tahu". |
| Pengaturan | Petugas | Aturan area, ambang, kamera, token Telegram. |
| Kelola Akun | Petugas (tahap lanjut) | Tambah dan nonaktifkan akun mahasiswa dan petugas. |
| Lapor Bahaya | Mahasiswa (tahap lanjut) | Formulir laporan manual teks + foto. |
| Cek Mandiri | Mahasiswa (tahap lanjut) | Unggah atau ambil foto diri untuk pengecekan perlengkapan. |

#### 6.4.2 Kebutuhan Backend dan Dashboard

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FD-1 | Autentikasi dengan dua peran (mahasiswa, petugas K3); setiap halaman dan endpoint memeriksa peran. | Wajib |
| FD-2 | Halaman pemantauan dengan video langsung. | Wajib |
| FD-3 | Notifikasi real-time di dashboard (WebSocket atau polling). | Wajib |
| FD-4 | Notifikasi Telegram untuk `fall_detected` dan `ppe_violation`. | Wajib |
| FD-5 | Riwayat kejadian dengan filter. | Wajib |
| FD-6 | Verifikasi kejadian oleh petugas. | Wajib |
| FD-7 | Konfigurasi aturan area. | Disarankan |
| FD-8 | Ekspor riwayat ke CSV. | Opsional |
| FD-9 | Indikator status kamera (aktif/mati) dan status model. | Disarankan |
| FD-10 | Laporan pelanggaran menampilkan foto bukti dengan kotak deteksi dan kelas yang terdeteksi. | Wajib |
| FD-11 | Petugas mengelola dokumen SOP (unggah, perbarui, hapus) dari antarmuka. | Wajib |
| FD-12 | Mahasiswa dapat membaca dokumen SOP dan melihat perlengkapan wajib per area. | Wajib |
| FD-13 | Halaman Hubungi Petugas untuk mahasiswa. | Wajib |
| FD-14 | Halaman statistik pelanggaran (per hari, jenis, area). | Disarankan |
| FD-15 | Halaman pertanyaan chatbot yang tidak terjawab. | Disarankan |
| FD-16 | Catatan tindak lanjut pada kejadian. | Opsional (tahap lanjut) |
| FD-17 | Kelola akun mahasiswa dan petugas. | Opsional (tahap lanjut) |
| FD-18 | Lapor Bahaya manual oleh mahasiswa. | Opsional (tahap lanjut) |
| FD-19 | Cek Mandiri dengan foto diri oleh mahasiswa (data foto tidak disimpan). | Opsional (tahap lanjut) |

### 6.5 Format Notifikasi

```
[K3Guard AI] INDIKASI JATUH
Area   : <nama area>
Kamera : <nama kamera>
Waktu  : <tanggal jam>
Catatan: Terindikasi seseorang terjatuh. Mohon verifikasi langsung di lokasi.
Gambar : <cuplikan>
```

```
[K3Guard AI] KETIDAKSESUAIAN PERLENGKAPAN
Area   : <nama area>
Waktu  : <tanggal jam>
Temuan : <daftar atribut, mis. kepala: tanpa helm; kaki: bukan sepatu safety>
Catatan: Berdasarkan deteksi kamera, mohon diperiksa langsung.
Gambar : <cuplikan>
```

## 7. Model Data (usulan, SQLite)

| Tabel | Kolom utama |
|---|---|
| `users` | id, nama, email, password_hash, role (`student`/`officer`), created_at |
| `areas` | id, nama, deskripsi |
| `area_rules` | id, area_id, attribute (`head`/`body`/`legs`/`feet`), required (bool) |
| `cameras` | id, area_id, nama, source (url/path), aktif |
| `events` | id, type (`ppe_violation`/`fall_detected`), area_id, camera_id, track_id, detail (JSON), confidence, created_at, verification (`pending`/`true`/`false_alarm`), verified_by, verified_at, follow_up_note |
| `event_media` | id, event_id, file_path, created_at |
| `notifications` | id, event_id, channel (`dashboard`/`telegram`), status, sent_at |
| `sop_documents` | id, nama_file, versi, uploaded_by, uploaded_at, status_index |
| `chat_logs` | id, session_id, user_id, pertanyaan, jawaban, sumber (JSON), answered (bool), created_at |
| `hazard_reports` (tahap lanjut) | id, user_id, area_id, deskripsi, file_path foto, status, created_at |

Vector store SOP disimpan terpisah (Chroma/FAISS) dan dapat dibangun ulang dari `sop_documents`.

## 8. API (usulan)

| Method | Endpoint | Peran | Fungsi |
|---|---|---|---|
| POST | `/auth/login` | Semua | Login, mengembalikan token. |
| POST | `/chat` | Mahasiswa, Petugas | Kirim pertanyaan, menerima jawaban dan sumber. |
| GET | `/areas` | Mahasiswa, Petugas | Daftar area dan perlengkapan wajib. |
| GET | `/sop` | Mahasiswa, Petugas | Daftar dan isi dokumen SOP. |
| GET | `/stream/{camera_id}` | Petugas | Stream video beranotasi (MJPEG atau WebSocket). |
| GET | `/status` | Petugas | Status person saat ini dan status kamera. |
| GET | `/events` | Petugas | Daftar kejadian (filter: type, area, tanggal, verification). |
| GET | `/events/{id}` | Petugas | Detail kejadian, foto bukti, dan catatan. |
| PATCH | `/events/{id}/verify` | Petugas | Tandai `true` atau `false_alarm`. |
| PATCH | `/events/{id}/note` | Petugas | Tambah catatan tindak lanjut (tahap lanjut). |
| GET | `/stats` | Petugas | Data statistik pelanggaran. |
| GET | `/chat/unanswered` | Petugas | Pertanyaan chatbot yang tidak terjawab. |
| WS | `/ws/notifications` | Petugas | Notifikasi real-time. |
| POST/DELETE | `/sop` | Petugas | Unggah atau hapus dokumen SOP dan jalankan indexing ulang. |
| GET/PUT | `/areas/{id}/rules` | Petugas | Baca dan ubah aturan area. |
| GET/PUT | `/settings/thresholds` | Petugas | Baca dan ubah ambang. |
| POST | `/hazard-reports` | Mahasiswa | Kirim laporan bahaya (tahap lanjut). |
| CRUD | `/users` | Petugas | Kelola akun (tahap lanjut). |

## 9. Arsitektur

```
Kamera --> [Pipeline CV]
            |-- YOLO deteksi (9 kelas) + tracker
            |-- Asosiasi + voting --> status PPE
            |-- Pose + mesin status + kelas person_danger --> status jatuh
            v
         [Backend API] <--> [SQLite] <--> [Penyimpanan cuplikan]
            |  \--> [Notifikasi: WebSocket, Telegram]
            |
            |--> [RAG: embedding + vector store + LLM]
            v
         [Dashboard Web + Chat]
```

Teknologi usulan: Python, Ultralytics YOLO, MediaPipe atau YOLO-pose, FastAPI, SQLite, Chroma/FAISS, LLM lewat API, Streamlit atau frontend web ringan, bot Telegram. Pilihan final ditetapkan setelah memeriksa perangkat yang tersedia.

## 10. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| Kinerja | ≥ 5 FPS inferensi pada perangkat uji; notifikasi jatuh ≤ 10 detik. |
| Perangkat | Disarankan GPU. Pada CPU, pakai model kecil (YOLOv8n/YOLO11n), turunkan resolusi (mis. 640) dan FPS. |
| Keandalan | Bila kamera terputus, pipeline mencoba menyambung ulang dan dashboard menampilkan status mati. |
| Keamanan | Password di-hash; akses dashboard dengan token; endpoint petugas ditolak untuk peran mahasiswa; mahasiswa tidak dapat mengakses video, foto kejadian, maupun riwayat kejadian; token Telegram disimpan di variabel lingkungan. |
| Privasi | Tanpa pengenalan wajah. Video tidak direkam terus-menerus; hanya cuplikan kejadian yang disimpan. Masa simpan cuplikan terbatas (usulan 30 hari) dan dapat dihapus petugas K3. Pemasangan kamera dan penyimpanan data mengikuti izin dan kebijakan institusi. |
| Bahasa | Antarmuka dan chatbot dalam Bahasa Indonesia. |
| Keterlacakan | Versi model, ambang, dan konfigurasi dicatat pada setiap kejadian. |

## 11. Data dan Pelabelan

### 11.1 Dataset Deteksi

| Item | Spesifikasi |
|---|---|
| Sumber | Foto dan frame video dari lab sendiri, dilengkapi dataset publik (Roboflow) bila cocok. |
| Ukuran target | ±2.000-3.000 gambar; ±500-800 contoh per kelas (minimum demo: ±200-300). |
| Komposisi | Minimal 30-50% dari lab sendiri; 5-10% gambar tanpa objek sebagai background. |
| Variasi | Beberapa orang, sudut, jarak, pencahayaan, dan kondisi tertutup sebagian. |
| Pembagian | 70% train, 20% validasi, 10% test. Frame dari satu video yang sama harus berada pada satu split saja agar tidak bocor. |
| Video | Diunggah ke Roboflow dengan laju 1-2 frame per detik; buang frame buram atau hampir kembar. |
| Kelas orang | `person_safe`: frame orang beraktivitas normal (termasuk duduk, jongkok, membungkuk). `person_danger`: frame orang terjatuh/terbaring, dari video peragaan. Target minimal ±300-500 contoh `person_danger` dari beberapa orang, lokasi, dan arah jatuh. |
| Augmentasi | Flip horizontal, brightness/contrast, blur ringan. |
| Keseimbangan | Jumlah `helmet` dan `no_helmet` (dan pasangan lain) dijaga mendekati seimbang. |

### 11.2 Video Uji Fall Detection

- Video uji disimpan terpisah dan tidak dipakai melatih. Video lain yang dipakai melabel `person_danger` di Roboflow harus berbeda dari video uji, dan sebaiknya direkam pada sesi atau dengan orang yang berbeda agar evaluasi tidak bocor.
- 30-50 video pendek: ±20 jatuh (berbagai arah dan kecepatan) dan 20-30 aktivitas normal yang mirip (duduk, jongkok, membungkuk, mengambil barang, berbaring sengaja jika relevan).
- Setiap video diberi label kebenaran (ada/tidak ada jatuh dan waktu jatuh) dalam satu berkas CSV.
- Dataset publik pembanding: UR Fall Detection dan Le2i.
- Semua peran dalam video adalah sukarelawan yang telah setuju direkam.

### 11.3 Dokumen dan Pertanyaan Uji SOP

- Seluruh SOP lab yang relevan dalam format teks atau PDF yang dapat diekstrak.
- 30-50 pertanyaan uji: pertanyaan umum, pertanyaan spesifik, dan 10 pertanyaan di luar cakupan SOP. Tiap pertanyaan punya jawaban acuan dan bagian SOP rujukannya.

## 12. Rencana Evaluasi

### 12.1 Modul A

| Pengujian | Metrik | Catatan |
|---|---|---|
| Deteksi objek | Precision, recall, F1, mAP50, mAP50-95 per kelas, confusion matrix | Pada split test. |
| Variasi kondisi | Metrik yang sama pada subset: cahaya terang/redup, jarak dekat/jauh, sudut berbeda, objek tertutup | Laporkan penurunan akurasi. |
| Tingkat person | Akurasi status person (COMPLIANT/NON_COMPLIANT/UNVERIFIED) terhadap label manual pada klip uji | Termasuk uji beberapa orang sekaligus. |
| Asosiasi | Persentase objek yang dikaitkan ke person yang benar | Uji kerumunan 2-4 orang. |

### 12.2 Modul B

| Metrik | Cara |
|---|---|
| Kesesuaian jawaban | Penilaian manual terhadap jawaban acuan (benar / sebagian / salah). |
| Relevansi retrieval | Apakah chunk sumber memuat jawaban (hit rate pada top-k). |
| Penolakan | Persentase pertanyaan di luar cakupan yang dijawab "tidak tahu". |
| Halusinasi | Jumlah jawaban yang memuat langkah yang tidak ada di SOP. |

### 12.3 Modul C

| Metrik | Cara |
|---|---|
| Precision, recall, F1 | Per video terhadap label kebenaran. |
| False alarm | Jumlah alarm palsu per jam pada video aktivitas normal. |
| Latensi | Selisih waktu dari awal kondisi `ALERT` sampai notifikasi diterima. |
| Confusion matrix | Jatuh vs normal, dengan rincian aktivitas mirip yang salah terdeteksi. |
| Perbandingan sumber | Metrik dihitung terpisah untuk `model`, `pose`, dan `both` untuk memilih aturan gabungan terbaik. |

### 12.4 Pengujian Sistem

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| T-1 | Orang memakai semua perlengkapan wajib berjalan di area | Status `COMPLIANT`, tidak ada kejadian. |
| T-2 | Orang tanpa helm berdiri di area ≥ 5 detik | Kejadian `ppe_violation` tercatat dan notifikasi terkirim. |
| T-3 | Kaki tidak terlihat kamera | Status `UNVERIFIED`, bukan `NON_COMPLIANT`. |
| T-4 | Dua orang berdekatan, satu memakai helm | Helm hanya dikaitkan ke orang yang benar. |
| T-5 | Orang jatuh dan tetap berbaring ≥ 3 detik | `fall_detected` dan notifikasi ≤ 10 detik. |
| T-6 | Orang jongkok atau membungkuk | Tidak ada alarm jatuh. |
| T-7 | Pertanyaan SOP yang ada jawabannya | Jawaban sesuai dan menampilkan sumber. |
| T-8 | Pertanyaan yang tidak ada di SOP | Chatbot menyatakan tidak tahu dan mengarahkan ke petugas. |
| T-9 | Kamera dicabut | Dashboard menampilkan status mati dan pulih saat tersambung kembali. |
| T-10 | Petugas menandai kejadian `False Alarm` | Status verifikasi tersimpan dan terlihat di riwayat. |
| T-11 | Mahasiswa mencoba membuka halaman atau endpoint petugas (live, laporan, kelola SOP) | Ditolak (akses tidak diizinkan). |
| T-12 | Petugas mengunggah SOP baru lalu mengajukan pertanyaan tentangnya di chatbot | Chatbot menjawab dengan merujuk SOP baru. |
| T-13 | Petugas membuka laporan pelanggaran tanpa helm | Foto bukti, kotak deteksi, waktu, dan area tampil. |
| T-14 | Orang terbaring di lantai ≥ 3 detik | Terdeteksi `person_danger`; kejadian `fall_detected` dengan `source` tercatat. |
| T-15 | Orang duduk atau jongkok | Terdeteksi `person_safe`, tidak ada alarm. |

## 13. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Dataset kurang atau label tidak konsisten | Akurasi rendah | Pedoman pelabelan tertulis; mulai pelabelan lebih awal; cek silang label sampel. |
| Kelas `no_*` ambigu | Banyak salah deteksi | Label hanya objek yang terlihat; jika terlalu sulit, pakai kelas positif saja dan status `UNVERIFIED`. |
| Kebocoran data antar split | Evaluasi terlalu optimistis | Pisahkan split berdasarkan video/orang, bukan frame acak. |
| Objek salah dikaitkan ke orang | Peringatan keliru | Zona tubuh, voting jendela waktu, uji kerumunan. |
| Akurasi turun di kondisi nyata | Demo gagal | Ambil data di lab sebenarnya; uji variasi cahaya dan sudut. |
| False alarm jatuh | Petugas kehilangan kepercayaan | Syarat bertahan, mesin status, cooldown, video uji aktivitas mirip. |
| Data `person_danger` sedikit dan kurang variatif (jatuh peragaan terlihat berbeda dari jatuh asli) | Model tidak mengenali jatuh sungguhan | Rekam banyak orang, arah, dan lokasi; jaga sinyal pose sebagai cadangan; evaluasi `source` secara terpisah. |
| Perangkat lambat | FPS rendah, notifikasi terlambat | Model kecil, resolusi dan FPS dikurangi. |
| Chatbot mengarang prosedur | Risiko keselamatan | Ambang relevansi, instruksi konteks-saja, tampilkan sumber, uji pertanyaan di luar cakupan. |
| Privasi dan izin kamera | Hambatan penggunaan | Urus izin sebelum pengambilan data; tanpa wajah; batasi penyimpanan. |
| Waktu terbatas | Fitur tidak selesai | Prioritaskan: Modul A dan B, lalu C, lalu dashboard penuh. |

## 14. Rencana Pengembangan (usulan, 1-2 orang, 4 minggu)

| Minggu | Pekerjaan | Hasil |
|---|---|---|
| 1 | Tulis pedoman pelabelan; kumpulkan dan label data; kumpulkan SOP; siapkan repositori dan kerangka backend; rekam video uji | Dataset versi 1, SOP, video uji |
| 2 | Latih dan evaluasi YOLO; tracker dan asosiasi; pipeline RAG dan antarmuka chat | Model v1, chatbot berjalan |
| 3 | Voting dan aturan area; fall detection pose + mesin status; notifikasi Telegram; dashboard dasar dan riwayat | Alur APD dan jatuh end-to-end |
| 4 | Integrasi; pengujian T-1 sampai T-10; penyetelan ambang; laporan evaluasi; dokumentasi dan demo | Prototipe siap demo dan laporan |

Jika data atau perangkat terlambat, potong dari bawah: fitur bertanda "tahap lanjut" (kelola akun, lapor bahaya, cek mandiri, catatan tindak lanjut), Telegram dan ekspor CSV, pengaturan area di UI (pakai berkas konfigurasi), lalu kelas `no_*` yang sulit dilabel.

## 15. Definisi Selesai (MVP)

1. Model mencapai target metrik pada 3.3, atau hasilnya dilaporkan lengkap dengan analisis penyebabnya.
2. Skenario T-1 sampai T-10 dijalankan dan hasilnya dicatat.
3. Dashboard menampilkan video langsung, status, notifikasi, dan riwayat.
4. Chatbot menjawab dengan sumber dan menolak pertanyaan di luar cakupan.
5. Dokumen pedoman pelabelan, konfigurasi ambang, dan cara menjalankan sistem tersedia.
6. Laporan evaluasi memuat keterbatasan sistem.

## 16. Pertanyaan Terbuka

1. Laboratorium dan SOP mana yang menjadi objek MVP, dan atribut apa yang wajib di area tersebut?
2. Apa definisi tepat `coverall` (baju praktikum) di lab Anda?
3. Apakah celana jeans benar-benar wajib? Jika ya, apakah celana non-jeans harus dilaporkan sebagai pelanggaran (membutuhkan kelas `no_jeans`)?4. Perangkat apa yang dipakai (GPU atau CPU, jenis kamera, posisi dan tinggi pemasangan)?
5. Apa kebijakan institusi tentang penyimpanan cuplikan gambar dan masa simpannya?
6. Siapa penerima notifikasi (satu atau beberapa petugas) dan lewat kanal apa?
7. Berapa tenggat dan jumlah anggota tim?

## 17. Glosarium

| Istilah | Arti |
|---|---|
| APD | Alat Pelindung Diri. |
| K3 | Keselamatan dan Kesehatan Kerja. |
| SOP | Standard Operating Procedure. |
| RAG | Retrieval-Augmented Generation: LLM menjawab berdasarkan potongan dokumen yang diambil lebih dulu. |
| YOLO | Model deteksi objek real-time. |
| Pose estimation | Estimasi titik-titik tubuh (bahu, pinggul, lutut, dll.) dari gambar. |
| mAP | Mean Average Precision, metrik utama deteksi objek. |
| False alarm | Peringatan yang muncul padahal kejadiannya tidak terjadi. |
| `UNVERIFIED` | Status ketika bukti visual tidak cukup untuk menyimpulkan patuh atau tidak. |
