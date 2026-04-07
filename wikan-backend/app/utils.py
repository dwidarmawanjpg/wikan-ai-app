from passlib.context import CryptContext # type: ignore
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt # type: ignore
import os
from passlib.context import CryptContext
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# --- KONFIGURASI SUPABASE ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("❌ SUPABASE_URL atau SUPABASE_KEY tidak ditemukan di environment!")

supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- KONFIGURASI JWT ---
SECRET_KEY = "kunci_rahasia_super_aman_wikan_project_group_1"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 525600 # Token (1 tahun)

# Konfigurasi Hashing Password
pwd_context = CryptContext(
    schemes=["bcrypt_sha256"],
    deprecated="auto"
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def time_ago(time_obj: datetime) -> str:
    now = datetime.utcnow()
    diff = now - time_obj
    seconds = diff.total_seconds()
    if seconds < 60:
        return "baru saja"
    elif seconds < 3600:
        return f"{int(seconds // 60)} menit lalu"
    elif seconds < 86400:
        return f"{int(seconds // 3600)} jam lalu"
    else:
        return f"{int(seconds // 86400)} hari lalu"