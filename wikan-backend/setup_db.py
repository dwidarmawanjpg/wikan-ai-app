"""
setup_db.py — Script sementara untuk:
1. Mengaktifkan ekstensi pgvector di Supabase
2. Membuat semua tabel dari models.py ke database Supabase

Jalankan sekali dari folder wikan-backend, lalu hapus file ini.
"""

import os
import sys

# ── Tambahkan folder 'app' ke path agar import absolut berfungsi ──────────────
APP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app")
sys.path.insert(0, APP_DIR)

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base

# ── Ambil DATABASE_URL dari .env ──────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL tidak ditemukan di .env! Hentikan.")
    sys.exit(1)

# Supabase: ganti port 5432 (direct, sering diblokir) ke 6543 (pooler/transaction)
# hanya jika masih menggunakan format db.xxx.supabase.co
if "db." in DATABASE_URL and ":5432/" in DATABASE_URL:
    DATABASE_URL_POOLER = DATABASE_URL.replace(
        "db.", "aws-0-ap-southeast-1.pooler."
    ).replace(":5432/", ":6543/")
    print(f"🔁 Menggunakan Supabase Pooler URL (port 6543)...")
    CONN_URL = DATABASE_URL_POOLER
else:
    CONN_URL = DATABASE_URL

print(f"🔗 Menghubungkan ke Supabase...")
print(f"   URL: {CONN_URL[:50]}...")

engine = create_engine(CONN_URL, pool_pre_ping=True)

# ── Langkah 1: Aktifkan ekstensi pgvector ─────────────────────────────────────
print("\n[1/2] Mengaktifkan ekstensi pgvector...")
try:
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()
    print("✅ Ekstensi 'vector' berhasil diaktifkan di Supabase!")
except Exception as e:
    print(f"⚠️  Info ekstensi vector: {e}")
    print("   (Kemungkinan sudah aktif, lanjut ke langkah berikutnya...)")

# ── Langkah 2: Import model dan buat semua tabel ─────────────────────────────
print("\n[2/2] Membuat tabel dari models.py...")
try:
    # Import Base langsung dari modul (bukan relative import)
    from database import Base, engine as db_engine  # noqa: F401
    import models  # Mendaftarkan semua class model ke Base.metadata  # noqa: F401

    # Gunakan engine baru yang mengarah ke pooler URL
    Base.metadata.create_all(bind=engine)
    print("✅ Semua tabel berhasil dibuat di Supabase!")
    print("\n📋 Tabel yang dibuat/ditemukan:")
    for table_name in Base.metadata.tables.keys():
        print(f"   ✔ {table_name}")

except Exception as e:
    print(f"❌ Gagal membuat tabel: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n🎉 Setup database Supabase selesai! Kamu bisa hapus file setup_db.py ini.")
