import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# Baca DATABASE_URL dari environment (.env → Supabase PostgreSQL)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("❌ DATABASE_URL tidak ditemukan di environment! Pastikan .env sudah dikonfigurasi.")

# Supabase PostgreSQL menggunakan koneksi SSL, tambahkan connect_args bila perlu
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,   # Cek koneksi sebelum digunakan (penting untuk cloud DB)
    pool_recycle=300,     # Recycle koneksi setiap 5 menit (cegah idle timeout)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# Dependency: digunakan di setiap endpoint yang butuh sesi database
def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        print(f"❌ Database Error: {str(e)}")
        raise e
    finally:
        db.close()