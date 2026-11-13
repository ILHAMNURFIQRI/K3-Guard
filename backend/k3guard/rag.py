"""Modul B: chatbot SOP berbasis RAG (PRD 6.2).

shortcut: indeks vektor = matriks numpy di memori (brute-force cosine), embedding disimpan di tabel sop_chunks.
Cukup untuk puluhan dokumen SOP; ganti ke FAISS/Chroma bila chunk > ~100 ribu.
"""
import json
import os
import re
import threading
from pathlib import Path

import numpy as np

from . import db
from .config import CFG

R = CFG["rag"]
UNKNOWN = ("Mohon maaf, saya tidak tahu karena pertanyaan itu tidak sesuai dengan SOP yang tersedia "
           "(APD, keselamatan kerja, dan pertolongan pertama). Silakan ajukan pertanyaan yang lain.")
EMERGENCY_NOTE = ("PENTING: Jika ini keadaan darurat nyata, segera hubungi petugas K3 dan ikuti prosedur "
                  "darurat resmi. Jangan menunggu jawaban chatbot.")
EMERGENCY_WORDS = re.compile(r"\b(pingsan|tidak sadar|tak sadar|kejang|berdarah|pendarahan|terbakar|kebakaran|"
                             r"tersengat|kesetrum|keracunan|sesak napas|terjatuh|luka parah|darurat)\b", re.I)
SYSTEM = f"""Anda adalah asisten SOP K3 untuk laboratorium praktikum kampus.
Aturan:
- Jawab dalam Bahasa Indonesia, spesifik dan langsung ke inti. Sebut semua item, angka, dan langkah yang tertulis di SOP, jangan diringkas jadi satu kalimat umum.
- Jawab HANYA berdasarkan teks SOP di dalam <konteks>. Jangan menambah prosedur, nilai, atau langkah keselamatan yang tidak tertulis di sana.
- Kata "lab", "laboratorium", dan "bengkel" pada pertanyaan berarti tempat yang dibahas SOP ini. Jangan menolak karena nama tempat berbeda.
- Hanya jika pertanyaan diawali Boleh, Apakah, atau Bisakah (pertanyaan ya/tidak), mulai jawaban dengan "Boleh." atau "Tidak boleh." lalu alasannya.
  Untuk pertanyaan lain (Apa, Bagaimana, Siapa, Kapan), jangan memulai dengan "Boleh" atau "Tidak boleh"; langsung jelaskan isinya.
- Jangan menyebut kata "potongan", "dokumen", "teks", "konteks", nomor urut, nama dokumen, nomor bagian, atau "Sumber" di dalam jawaban. Sumber ditampilkan terpisah oleh sistem.
- HANYA jika tidak ada satu pun potongan yang menjawab pertanyaan, atau pertanyaan di luar topik APD, keselamatan kerja, dan pertolongan pertama
  (misalnya matematika, hiburan, politik, kode program, pengetahuan umum), balas persis: "{UNKNOWN}"
- Anda bukan tenaga medis; jangan memberi diagnosis."""

_lock = threading.Lock()
_embedder = None
_index = {"vecs": np.zeros((0, 1), dtype=np.float32), "meta": []}


def _embed(texts):
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer
        _embedder = SentenceTransformer(R["embed_model"])
    return _embedder.encode(texts, normalize_embeddings=True, convert_to_numpy=True).astype(np.float32)


# ---- ingest
def extract(path):
    """Return [(section, text)]: halaman untuk PDF, judul terakhir untuk DOCX, seluruh berkas untuk TXT."""
    path = Path(path)
    ext = path.suffix.lower()
    if ext == ".pdf":
        from pypdf import PdfReader
        return [(f"hal. {i + 1}", p.extract_text() or "") for i, p in enumerate(PdfReader(path).pages)]
    if ext == ".docx":
        import docx
        out, sec, buf = [], "awal", []
        for para in docx.Document(path).paragraphs:
            if para.style.name.lower().startswith("heading") and para.text.strip():
                if buf:
                    out.append((sec, "\n".join(buf)))
                sec, buf = para.text.strip(), []
            elif para.text.strip():
                buf.append(para.text)
        if buf:
            out.append((sec, "\n".join(buf)))
        return out
    out, sec, buf = [], "isi", []  # TXT: baris "## Judul" memulai bagian baru, agar sumber bisa menyebut bagiannya
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if line.startswith("## "):
            if buf:
                out.append((sec, "\n".join(buf)))
            sec, buf = line[3:].strip(), []
        else:
            buf.append(line)
    out.append((sec, "\n".join(buf)))
    return out


def chunk(sections):
    # shortcut: 1 token ~ 0.75 kata untuk teks Indonesia; pakai tokenizer bila butuh ukuran presisi
    size, step = int(R["chunk_tokens"] * 0.75), int((R["chunk_tokens"] - R["overlap_tokens"]) * 0.75)
    out = []
    for sec, text in sections:
        words = text.split()
        for i in range(0, max(len(words), 1), step):
            piece = " ".join(words[i:i + size])
            if piece.strip():
                out.append((sec, piece))
            if i + size >= len(words):
                break
    return out


def index_document(doc_id):
    doc = db.q("SELECT * FROM sop_documents WHERE id=?", (doc_id,), one=True)
    db.ex("UPDATE sop_documents SET status_index='indexing' WHERE id=?", (doc_id,))
    try:
        chunks = chunk(extract(doc["file_path"]))
        if not chunks:
            raise ValueError("teks tidak dapat diekstrak (PDF hasil scan?)")
        vecs = _embed([f"{s}. {t}" for s, t in chunks])  # judul bagian ikut di-embed: pertanyaan "RJP" cocok ke bagian "Henti Jantung"
        db.ex("DELETE FROM sop_chunks WHERE doc_id=?", (doc_id,))
        for (sec, text), v in zip(chunks, vecs):
            db.ex("INSERT INTO sop_chunks(doc_id,section,text,embedding) VALUES(?,?,?,?)",
                  (doc_id, sec, text, v.tobytes()))
        db.ex("UPDATE sop_documents SET status_index=? WHERE id=?", (f"selesai ({len(chunks)} chunk)", doc_id))
    except Exception as e:
        db.ex("UPDATE sop_documents SET status_index=? WHERE id=?", (f"gagal: {e}", doc_id))
    reload_index()


def reload_index():
    rows = db.q("SELECT c.section, c.text, c.embedding, d.nama_file FROM sop_chunks c "
                "JOIN sop_documents d ON d.id=c.doc_id")
    with _lock:
        _index["meta"] = [{"doc": r["nama_file"], "section": r["section"], "text": r["text"]} for r in rows]
        _index["vecs"] = (np.stack([np.frombuffer(r["embedding"], dtype=np.float32) for r in rows])
                          if rows else np.zeros((0, 1), dtype=np.float32))


_STOP = {"apa", "saja", "yang", "dan", "atau", "dengan", "untuk", "pada", "dari", "ini", "itu", "boleh", "apakah", "bagaimana",
         "cara", "saat", "jika", "kalau", "harus", "dilakukan", "bisa", "bisakah", "adalah", "siapa", "kapan", "berapa", "dimana"}


def retrieve(question, k):
    """Skor = kemiripan embedding + bonus kata kunci. Embedding kecil sering luput pada kata spesifik (sandal, APAR)."""
    with _lock:
        vecs, meta = _index["vecs"], _index["meta"]
    if not meta:
        return []
    cos = vecs @ _embed([question])[0]
    words = {w for w in re.findall(r"[a-z]{4,}", question.lower()) if w not in _STOP}
    texts = [m["text"].lower() for m in meta]
    idf = {w: np.log((len(texts) + 1) / (sum(w in t for t in texts) + 1)) + 0.1 for w in words}  # kata langka (bubut) lebih berbobot dari kata umum (keselamatan)
    lex = np.array([sum(idf[w] for w in words if w in t) / max(sum(idf.values()), 1e-9) for t in texts])
    scores = cos + 0.6 * lex
    top = np.argsort(-scores)[:k]
    return [{**meta[i], "score": float(scores[i])} for i in top]


# ---- answer
def _llm(question, hits, history):
    """Penyedia dipilih di config.yaml rag.llm_provider: ollama (lokal, gratis), gemini, atau claude."""
    ctx = "\n\n".join(f"<dokumen>\n{h['text']}\n</dokumen>" for h in hits)  # tanpa nama berkas: model kecil suka menyalin label ke jawaban
    msgs = [m for turn in history[-6:] for m in
            ({"role": "user", "content": str(turn["q"])[:2000]}, {"role": "assistant", "content": str(turn["a"])[:4000]})]
    msgs.append({"role": "user", "content": f"<konteks>\n{ctx}\n</konteks>\n\nPertanyaan: {question}"})
    provider = R.get("llm_provider", "claude")
    if provider == "ollama":
        import httpx
        try:
            r = httpx.post(R.get("ollama_url", "http://127.0.0.1:11434") + "/api/chat", timeout=180, json={
                "model": R["ollama_model"], "stream": False, "options": {"temperature": 0},
                "messages": [{"role": "system", "content": SYSTEM}] + msgs})
        except httpx.ConnectError:
            raise RuntimeError("Ollama tidak berjalan (buka aplikasi Ollama)")
        if r.status_code == 404:
            raise RuntimeError(f"model Ollama belum diunduh: ollama pull {R['ollama_model']}")
        r.raise_for_status()
        return r.json()["message"]["content"].strip()
    if provider == "gemini":
        import httpx
        if not os.environ.get("GEMINI_API_KEY"):
            raise RuntimeError("GEMINI_API_KEY belum diatur di terminal yang menjalankan run.py")
        r = httpx.post(f"https://generativelanguage.googleapis.com/v1beta/models/{R['gemini_model']}:generateContent", timeout=60,
                       headers={"x-goog-api-key": os.environ["GEMINI_API_KEY"]},
                       json={"systemInstruction": {"parts": [{"text": SYSTEM}]},
                             "contents": [{"role": "user" if m["role"] == "user" else "model", "parts": [{"text": m["content"]}]} for m in msgs]})
        r.raise_for_status()
        return r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError("ANTHROPIC_API_KEY belum diatur di terminal yang menjalankan run.py")
    import anthropic
    resp = anthropic.Anthropic().beta.messages.create(
        model=R["llm_model"], max_tokens=2000, system=SYSTEM, messages=msgs,
        output_config={"effort": "low"},
        betas=["server-side-fallback-2026-07-01"], fallbacks="default",
    )
    if resp.stop_reason == "refusal":
        return UNKNOWN
    return "".join(b.text for b in resp.content if b.type == "text").strip()


def answer(question, session_id, user_id, history):
    emergency = bool(EMERGENCY_WORDS.search(question))
    hits, failed = retrieve(question, R["top_k"]), False
    if not hits or hits[0]["score"] < R["min_score"]:
        text, sources = UNKNOWN, []  # relevansi rendah: LLM tidak dipanggil (PRD 6.2.1 langkah 4)
    else:
        try:
            text = _llm(question, hits, history)
            text = re.sub(r"\n*\(?\s*Sumber\s*:.*\Z", "", text, flags=re.I | re.S)  # model kecil kadang tetap menulis "Sumber:"
            text = re.sub(r"(?i)\b(berdasarkan|menurut|sesuai)\s+(potongan|dokumen|teks)(\s+(ke-?\s*)?(\d+|pertama|kedua|ketiga|keempat|kelima))?\s*,?\s*", "", text)
            text = re.sub(r"</?(?:potongan|dokumen)>|\[\d+\]\s*\S+\.(?:txt|pdf|docx)\s*(?:\([^)\n]*\))?:?", "", text).strip()
            text = re.sub(r"^(Tidak boleh\.|Boleh\.)\s+([a-z])", lambda m: f"{m[1]} {m[2].upper()}", text[:1].upper() + text[1:])
        except Exception as e:
            failed = True  # gangguan layanan bukan "tidak ada di SOP": jangan dicatat sebagai terjawab
            text = f"Asisten AI belum bisa menjawab: {e if isinstance(e, RuntimeError) else type(e).__name__}. Hubungi petugas K3."
        sources = [{"doc": h["doc"], "section": h["section"], "score": round(h["score"], 3)} for h in hits]
    if not re.match(r"\s*(boleh|apakah|bisakah|bolehkah|dapatkah)", question, re.I):
        text = re.sub(r"^\s*(Tidak boleh|Boleh)\.\s*", "", text)  # model kecil salah memakai "Boleh/Tidak boleh" untuk pertanyaan non ya/tidak
    if text.startswith("Mohon maaf, saya tidak tahu"):  # model kecil sering memparafrase kalimat penolakan
        text = UNKNOWN
    answered = not failed and UNKNOWN not in text
    if not answered:
        sources = []
    if emergency:
        text = f"{EMERGENCY_NOTE}\n\n{text}"
    db.ex("INSERT INTO chat_logs(session_id,user_id,pertanyaan,jawaban,sumber,answered,created_at) "
          "VALUES(?,?,?,?,?,?,?)", (session_id, user_id, question, text, json.dumps(sources), int(answered), db.now()))
    return {"answer": text, "sources": sources, "answered": answered, "emergency": emergency}


def warmup():
    """Muat model embedding dan model Ollama di latar belakang saat server mulai, agar pertanyaan pertama tidak lambat."""
    def run():
        try:
            _embed(["pemanasan"])
            if R.get("llm_provider") == "ollama":
                import httpx
                httpx.post(R.get("ollama_url", "http://127.0.0.1:11434") + "/api/generate", timeout=300,
                           json={"model": R["ollama_model"], "prompt": "", "keep_alive": "30m"})
        except Exception:
            pass  # warmup hanya optimasi; kegagalan muncul lagi saat ada pertanyaan sungguhan
    threading.Thread(target=run, daemon=True).start()
