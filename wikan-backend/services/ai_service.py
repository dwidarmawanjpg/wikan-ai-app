import os
import sys
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.getcwd()) 

try:
    from langchain_community.document_loaders import PyPDFLoader
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
    from sqlalchemy.orm import Session
    from sqlalchemy import select
    from app.database import SessionLocal
    from app.models import DocumentChunk
    
except ImportError as e:
    print(f"❌ Error Import Library: {e}")
    sys.exit(1)

# Ambil API Key dari .env
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError("❌ GOOGLE_API_KEY tidak ditemukan di environment!")

# --- KONFIGURASI AI ---
# Menggunakan Gemini Text Embedding API (dimensi output otomatis: 3072)
EMBEDDING_MODEL = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001", 
    google_api_key=GOOGLE_API_KEY
)

import requests
import uuid

def process_document_for_ai(file_path: str, doc_id: int):
    """
    Fungsi 1: MEMBACA & MENGINGAT DOKUMEN (Ingestion ke PostgreSQL)
    """
    print(f"🤖 AI SERVICE: Memulai pemrosesan dokumen ID {doc_id}...")
    db: Session = SessionLocal()
    
    local_tmp_path = None
    
    try:
        # Jika file adalah URL (dari Supabase Storage)
        if file_path.startswith("http://") or file_path.startswith("https://"):
            print(f"   ↳ Mengunduh file dari cloud: {file_path}")
            response = requests.get(file_path)
            response.raise_for_status()
            
            # Simpan sementara di lokal
            local_tmp_path = f"temp_{uuid.uuid4().hex}.pdf"
            with open(local_tmp_path, "wb") as f:
                f.write(response.content)
            
            target_path_for_loader = local_tmp_path
        else:
            # Validasi File Lokal
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File lokal tidak ditemukan: {file_path}")
            target_path_for_loader = file_path
            
        # 1. Load PDF
        loader = PyPDFLoader(target_path_for_loader)
        pages = loader.load()

        # 2. Pecah Dokumen jadi potongan kecil (chunks)
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(pages)
        
        print(f"   ↳ PDF dipecah menjadi {len(chunks)} bagian. Men-generate vektor embedding dengan Gemini...")

        # 3. Masukkan setiap chunk ke Database Supabase (pgvector)
        # Ekstrak konten teks dari semua chunk
        texts = [chunk.page_content for chunk in chunks]
        
        # Panggil API Gemini untuk menghitung Vektor sekaligus (batch)
        embeddings = EMBEDDING_MODEL.embed_documents(texts)
        
        # Siapkan objek model SQLAlchemy untuk disimpan
        db_chunks = []
        for i, text_content in enumerate(texts):
            db_chunk = DocumentChunk(
                document_id=doc_id,
                content=text_content,
                chunk_index=i,
                embedding=embeddings[i]  # Ini adalah array [0.01, -0.02, ... 768 dimensi]
            )
            db_chunks.append(db_chunk)
            
        # Bulk insert ke tabel document_chunks
        db.add_all(db_chunks)
        db.commit()
        
        print(f"✅ SUKSES: Dokumen {doc_id} masuk ke database pgvector di Supabase!")
        return True

    except Exception as e:
        print(f"❌ GAGAL PROSES AI: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()
        if local_tmp_path and os.path.exists(local_tmp_path):
            try:
                os.remove(local_tmp_path)
            except Exception as e:
                print(f"⚠️ Gagal menghapus file temp lokal: {e}")

def remove_document_from_ai(doc_id: int):
    """
    Fungsi 2: MENGHAPUS INGATAN (Deletion dari pgvector)
    """
    print(f"🧹 AI SERVICE: Menghapus ingatan dokumen ID {doc_id}...")
    db: Session = SessionLocal()
    try:
        # Hapus semua potongan chunk yang berhubungan dengan document_id ini
        deleted_count = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).delete()
        db.commit()
        print(f"✅ Ingatan terhapus. {deleted_count} chunk dibuang dari Supabase.")
        return True 
    
    except Exception as e:
        print(f"⚠️ Gagal hapus ingatan: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()
    
def get_answer_from_gemini(query: str):
    """
    Fungsi 3: MENJAWAB PERTANYAAN MENGGUNAKAN SIMILARITY SEARCH (pgvector) + GEMINI
    """
    db: Session = SessionLocal()
    try:
        # Cek apakah ada ingatan di database
        total_chunks = db.query(DocumentChunk).count()
        if total_chunks == 0:
            return "Wikan belum memiliki ingatan dokumen. Silakan upload dan approve dokumen terlebih dahulu."

        # 1. Ubah pertanyaan user (text) menjadi Vektor angka dengan Gemini
        query_embedding = EMBEDDING_MODEL.embed_query(query)
        
        # 2. SEMANTIC SEARCH MENGGUNAKAN PGVECTOR
        # Kita menggunakan operator jarak cosinus (cosine distance / <=> ) bawaan fungsi pgvector
        # Mengambil 3 teks dokumen teratas (paling relevan/mirip dengan pertanyaan user)
        results = (
            db.query(DocumentChunk)
            .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
            .limit(3)
            .all()
        )
        
        if not results:
            print("⚠️ DEBUG: Tidak ada potongan dokumen (chunks) yang direturn dari query Supabase pgvector.")
            return "Maaf, informasi tidak ditemukan di dokumen."

        # 3. Gabungkan teks dari hasil pencarian menjadi konteks
        print("🔍 DEBUG: Potongan dokumen yang berhasil ditarik dari database:")
        context_chunks = []
        for i, chunk in enumerate(results):
            print(f"   [{i+1}] {chunk.content[:200]}...")
            context_chunks.append(chunk.content)
            
        context_text = "\n\n---\n\n".join(context_chunks)
        
        # 4. Kirim ke LLM (Gemini 2.5 Flash) untuk menjawab bahasa natural
        llm = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash", temperature=0.0, google_api_key=GOOGLE_API_KEY)
        
        prompt_template = f"""
        Kamu adalah asisten profesional bernama WIKAN.
        Jawablah pertanyaan berikut ini HANYA berdasarkan informasi dari KONTEKS DOKUMEN di bawah ini.
        Jika jawabannya tidak ada di dalam dokumen, katakan dengan jelas bahwa kamu tidak tahu atau informasi tersebut tidak tersedia di dokumen.
        JANGAN PERNAH menggunakan pengetahuan luarmu atau mengarang jawaban di luar konteks ini.

        KONTEKS DOKUMEN:
        {context_text}

        PERTANYAAN PENGGUNA:
        {query}

        JAWABAN:
        """

        response = llm.invoke(prompt_template)
        return response.content

    except Exception as e:
        print(f"❌ ERROR GEMINI: {str(e)}")
        return "Terjadi kesalahan saat mengakses otak AI."
    finally:
        db.close()