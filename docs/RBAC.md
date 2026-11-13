# RBAC K3Guard AI

Sumber tunggal: `backend/k3guard/rbac.py`. Endpoint memakai `Depends(need("izin"))`; izin dikirim ke frontend lewat `GET /api/auth/me` (`permissions`).

| Izin | Mahasiswa | Petugas K3 | Endpoint |
|---|:-:|:-:|---|
| `monitoring.view` (live + status APD) | ya | ya | `/status`, `/frame/{id}`, `/stream/{id}` |
| `chat.ask` (Asisten K3) | ya | ya | `/chat` |
| `chat.sources` (lihat sumber SOP) | - | ya | isi `sumber` di `/chat` |
| `sop.read` | ya | ya | `GET /sop`, `/sop/{id}/download` |
| `area.read` | ya | ya | `GET /areas` |
| `chat.unanswered` | - | ya | `/chat/unanswered` |
| `event.view` (laporan, foto kejadian) | - | ya | `/events`, `/events/{id}`, `/storage/{nama}` |
| `event.verify` (verifikasi, catatan) | - | ya | `PATCH /events/{id}/verify`, `/note` |
| `stats.view` | - | ya | `/stats` |
| `sop.manage` (unggah, perbarui, hapus, reindex) | - | ya | `POST/PUT/DELETE /sop`, `/sop/reindex` |
| `area.manage` | - | ya | `POST /areas`, `PUT /areas/{id}/rules` |
| `settings.manage` | - | ya | `/settings/thresholds` |
| `stream.control` | - | ya | `/monitoring/stream/{id}/start|stop` |
| `notification.receive` | - | ya | WebSocket `/ws/notifications` |

Tanpa token: 401. Token valid tapi tanpa izin: 403.

Frontend: `ProtectedRoute allowedRole` membatasi halaman per peran; ini hanya kenyamanan UI, penegakan sebenarnya di backend. Tes: `backend/tests/test_rbac.py`.

Menambah peran atau izin: ubah `rbac.py`, tambahkan `need("izin")` pada endpoint baru.
