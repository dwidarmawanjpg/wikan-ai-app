# WIKAN-AI (Web-base Intelligence Knowledge Asisten Navigator)

**WIKAN-AI** adalah asisten pendidikan tingkat lanjut berbasis teks yang dirancang untuk mendemokratisasi akses ke dokumen riset dan literatur (berfokus pada edukasi dan kesehatan mental). Menggunakan arsitektur RAG *(Retrieval-Augmented Generation)*, Wikan mampu "membaca" ribuan dokumen PDF, dan menjawab pertanyaan bahasa natural pengguna secara akurat murni berdasarkan konteks akademis tersimpan.

---

## 🚀 Arsitektur & Teknologi Utama
Pembaruan terbaru mengangkat WIKAN menuju infrastruktur *Serverless & Cloud-Native*:
- **Frontend Layer:** React 19 + TypeScript + Vite + TailwindCSS.
- **Backend Layer:** FastAPI (Python) - *Serverless-ready*.
- **Database & Auth:** PostgreSQL di Supabase.
- **Vector Engine:** `pgvector` di Supabase (menggantikan FAISS lokal).
- **Cloud Storage:** Supabase Storage Bucket (`wikan_documents`).
- **AI Brain:** Google Gemini 2.5 Flash API (Generator) & `gemini-embedding-001` (Encoder Vektor 3072 dimensi).

---

## 👥 Ekosistem Peran WIKAN (Roles Matrix)

Aplikasi memiliki 4 pilar tingkatan hak akses (*Single Source of Truth* arsitektur Frontend):

1. **GUEST (Tamu Akses Bebas)**  
   - Boleh menelusuri rute Publik seperti *Landing Page*.
   - Tidak memiliki profil atau riwayat di Database.
   - Punya akses ke halaman obrolan namun **dibatasi (Mocked Output)** tanpa RAG penuh.

2. **USER (Pengguna Pembelajar)**  
   - **Rute Eksklusif:** `/dashboard`
   - *Core User* untuk berinteraksi dengan **Model WIKAN AI**.
   - Fitur obrolannya terhubung ke memori yang persisten di Database (Pembuatan/Penamaan Sesi & Riwayat Chat).

3. **CONTRIBUTOR (Penyalur Jurnal)**  
   - **Rute Eksklusif:** `/dashboard-contributor`
   - Hanya memiliki akses pada ruang panel *Manajemen Berkas*.
   - Tugas utamanya menunggah literatur riset (PDF) bersama atribut meta.
   - Hak hapus hanya berlaku pada karya mereka sendiri yang berstatatus PENDING atau REJECTED.

4. **ADMINISTRATOR (Kurator & Validator)**  
   - **Rute Eksklusif:** `/dashboard-admin`
   - *Review & Approval Panel* untuk menyaring sampah PDF.
   - Memiliki kemampuan klik `Approve & Publish`. Aksi ini seketika mengirim sinyal ke server AI untuk melakukan tugas asinkronus (Parsing PDF -> Chunking -> Vectorizing -> PGVector Insertion).
   - Layar pemantauan penuh (Total Dokumen & Daftar Pengguna aktif).

---

## 🛠️ Panduan Instalasi & Eksekusi Jaringan Sosial WIKAN

> [!IMPORTANT]
> Pastikan perangkat Anda sudah terinstal **Python 3.10+** (Backend) dan **Node.js 18+** (Frontend).

### Tahap 1: Konfigurasi Backend Server
1. Buka Terminal CLI, navigasikan *path default*: `cd wikan-backend`
2. Bangun selubung lingkungan (Virtual Engine):
   ```bash
   python -m venv venv
   ```
3. Bangkitkan selubung tersebut:
   - **Windows:** `venv\Scripts\activate`
   - **Mac/Linux:** `source venv/bin/activate`
4. Segarkan direktori *Dependencies* sistem:
   ```bash
   pip install -r requirements.txt
   ```
5. Siapkan `Environment Variables` rahasia di file `.env`. (Buat manual file `.env` di *root* backend).
   ```env
   # Akses Server Database PostgreSQL via Pooling (WAJIB pakai pool port Supabase)
   DATABASE_URL="postgresql://postgres.[PROYEK_ANDA]:[PASSWORD_ANDA]@aws-0-ap-southeast-X.pooler.supabase.com:6543/postgres"

   # Layanan Keamanan Token & Cloud
   SECRET_KEY="kunci_rahasia_anda"
   ALGORITHM="HS256"

   # Supabase Koneksi Cloud
   SUPABASE_URL="https://[PROYEK_ANDA].supabase.co"
   SUPABASE_KEY="[ANON_PUBLIC_KEY]"

   # Otak Integrasi Google AI
   GOOGLE_API_KEY="AIzaSyA..."
   ```
6. Sambungkan Arus API via Uvicorn:
   ```bash
   uvicorn app.main:app --reload
   ```

### Tahap 2: Konfigurasi Frontend Vite
1. Buka tab terminal baru, navigasikan *path default*: `cd wikan-frontend`
2. Pasang semua perpusatakaan Node:
   ```bash
   npm install
   ```
3. Bangkitkan server port `localhost:5173`:
   ```bash
   npm run dev
   ```

---

## 🎯 Siklus Hidup Dokumen (Workflow Inti)

1. **Inception (Tahap Penumbuhan):** Pengguna dengan role `Contributor` masuk ke portal dasbor mereka dan menyerahkan file PDF jurnal.
2. **Quarantine (Tahap Karantina):** File PDF masuk ke awan *Supabase Storage*, tetapi secara status DB dilabeli `PENDING`. Otak RAG dan pengguna umum tidak diizinkan membaca isinya.
3. **Execution (Tahap Eksekusi Audit):** `Admin` mengklik tombol "Approve". Seketika program AI Wikan (*ai_service.py*) akan menyedot dokumen dari awan, memecah halamannya, menciptakan *Array Vector 3072* dimensi, dan menyimpannya di DB (*PostgreSQL pgvector*).
4. **Resonance (Pemanfaatan AI):** `User` melontarkan berbagai macam tipe pertanyaan ke layanan `A.I Chat`. Mesin akan mencari kesamaan kosinus (*Cosine Distance Similarity*) lalu menyajikan konteks dokumen ke LLM Gemini demi menyusun presentasi jawaban natural yang akurat 100% tanpa risiko Halusinasi!

---
*Didesain dan dikembangkan oleh Tim Wikan AI Group 1 - 2025*