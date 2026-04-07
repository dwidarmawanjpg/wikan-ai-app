from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from jose import JWTError, jwt # type: ignore
from pydantic import BaseModel
from typing import List 
import shutil 
import os
import uuid 

from . import models, schemas, utils, database
from .database import engine, get_db
from sqlalchemy import func
from .utils import supabase_client
from services.ai_service import get_answer_from_gemini

# Google Auth imports
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os
import uuid



app = FastAPI(
    title="Wikan AI Service",
    description="Sistem Chatbot AI Berbasis Dokumen PDF",
    version="1.0.0"
)

try:
    from services.ai_service import process_document_for_ai
except ImportError:
    from ai_service import process_document_for_ai

# Buat tabel jika belum ada (tanpa menghapus metadata terlebih dahulu)
models.Base.metadata.create_all(bind=engine)

class DocumentStatusUpdate(BaseModel):
    status: str

# Local uploads folder is completely omitted now as we use Serverless storage.

from typing import Optional

class ChatRequest(BaseModel):
    question: str
    session_id: Optional[int] = None

# get_db sudah diimport dari .database, tidak perlu didefinisikan ulang di sini

# Skema keamanan
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Fungsi untuk mengecek dan membaca Token User
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, utils.SECRET_KEY, algorithms=[utils.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


# Setting CORS
origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTES ---
@app.get("/")
def read_root():
    return {"message": "Halo, Backend WIKAN sudah hidup dengan UUID! 🚀"}

@app.post("/auth/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ini sudah terdaftar."
        )
    
    hashed_pwd = utils.hash_password(user.password)
    
    new_user = models.User(
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        password_hash=hashed_pwd,
        
        institution=user.institution,
        profession=user.profession,
        phone_number=user.phone_number
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@app.post("/auth/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    if not user or not utils.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = utils.create_access_token(
        data={"sub": user.email, "role": user.role, "id": str(user.id)}
    )
    
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

class GoogleAuthRequest(BaseModel):
    token: str

@app.post("/auth/google")
def auth_google(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        # Verify the ID token
        CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
        idinfo = id_token.verify_oauth2_token(request.token, google_requests.Request(), CLIENT_ID)

        email = idinfo.get('email')
        name = idinfo.get('name', 'Google User')

        if not email:
            raise HTTPException(status_code=400, detail="Token does not contain an email")

        # Check if user exists
        user = db.query(models.User).filter(models.User.email == email).first()

        if not user:
            # Create a new user with random password
            random_password = str(uuid.uuid4())
            hashed_pwd = utils.hash_password(random_password)
            user = models.User(
                email=email,
                full_name=name,
                password_hash=hashed_pwd,
                role=models.UserRole.STUDENT
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Generate JWT token
        access_token = utils.create_access_token(
            data={"sub": user.email, "role": user.role, "id": str(user.id)}
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": user.role,
            "full_name": user.full_name
        }

    except ValueError as e:
        print(f"Google Token Verification Error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid Google token")

@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/documents/upload", response_model=schemas.DocumentResponse)
async def upload_document(
    title: str = Form(...),              
    description: str = Form(None),  
    file: UploadFile = File(...),      
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
  
    if current_user.role != models.UserRole.CONTRIBUTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Hanya Contributor yang diizinkan mengupload dokumen."
        )

  
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Hanya file PDF yang diperbolehkan.")

    file_extension = ".pdf"
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    try:
        # Load file dari RAM
        file_bytes = await file.read()
        
        # Mengunggah ke Supabase Storage (Bucket Public)
        res = supabase_client.storage.from_("wikan_documents").upload(
            path=unique_filename,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )
        
        # Meminta Public URL
        public_url = supabase_client.storage.from_("wikan_documents").get_public_url(unique_filename)
        
        file_location = public_url
        file_size = len(file_bytes)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menyimpan file ke Cloud Storage: {str(e)}")

    # 5. Catat Metadata ke Database
    new_document = models.Document(
        title=title,
        description=description,
        file_path=file_location,    
        file_type=file.content_type,
        file_size=file_size,
        status=models.DocumentStatus.PENDING.value, 
        uploader_id=current_user.id  
    )

    db.add(new_document)
    db.commit()
    db.refresh(new_document)

    # Catat audit log
    db.add(models.ActivityLog(
        actor_id=current_user.id,
        target_document_id=new_document.id,
        action="Upload",
        details="Dokumen berhasil diupload ke Storage"
    ))
    db.commit()

    print(f"📄 Dokumen Baru: {title} oleh User ID {current_user.id} [STATUS: PENDING]")

    return new_document

@app.get("/documents/my-uploads", response_model=list[schemas.DocumentResponse])
async def get_my_documents(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    documents = db.query(models.Document).filter(
        models.Document.uploader_id == current_user.id
    ).all()
    
    return documents

# --- ENDPOINT DELETE DOCUMENT ---
@app.delete("/documents/{document_id}")
async def delete_document(
    document_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
  
    if not document:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")
    

    if document.uploader_id != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Anda tidak memiliki izin untuk menghapus dokumen ini")

    # Hapus file fisik dari Supabase Cloud
    if document.file_path:
        try:
            # Contoh ekstrasi URL: https://xx.supabase.co/storage/v1/object/public/wikan_documents/abcd.pdf
            filename = document.file_path.split("/")[-1]
            if filename:
                supabase_client.storage.from_("wikan_documents").remove([filename])
        except Exception as e:
            print(f"Error saat menghapus file fisik di Supabase cloud: {e}")
  
    db.delete(document)
    db.commit()
    
    # Catat audit log
    db.add(models.ActivityLog(
        actor_id=current_user.id,
        target_document_id=None,
        action="Hapus Berkas",
        details=f"Dokumen ID {document_id} dihapus"
    ))
    db.commit()
    
    return {"message": "Dokumen dan file fisik berhasil dihapus permanen"}


# --- ENDPOINT KHUSUS ADMIN ---

# MELIHAT SEMUA DOKUMEN (Admin Only)
@app.get("/admin/documents", response_model=List[schemas.DocumentResponse])
async def get_all_documents_admin(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user_role = current_user.role.upper().strip()
    if user_role != "ADMIN":
        print(f"DEBUG: Akses ditolak untuk user {current_user.email} dengan role: '{user_role}'")
        raise HTTPException(status_code=403, detail=f"Akses ditolak. Role Anda adalah {user_role}")
    
    documents = db.query(models.Document).order_by(models.Document.id.desc()).all()
    return documents

# UPDATE STATUS DOKUMEN (Approve/Reject)
@app.put("/admin/documents/{document_id}/status")
async def update_document_status(
    document_id: int,
    status_data: DocumentStatusUpdate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Security Check
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Hanya Admin yang boleh mengubah status.")

    # Cari Dokumen
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")

    # Validasi Input Status (Biar gak salah ketik)
    new_status = status_data.status.upper() # Paksa jadi huruf besar
    if new_status not in ["PENDING", "APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Status tidak valid. Gunakan: PENDING, APPROVED, atau REJECTED.")

    # Simpan Perubahan
    document.status = new_status
    db.commit()
    db.refresh(document)

    if status_data.status == "APPROVED":
        print(f"⚡ Trigger: Dokumen {document_id} disetujui. Mengirim ke AI Service...")
        
        background_tasks.add_task(process_document_for_ai, document.file_path, document.id)
    
    return {"message": f"Status dokumen diperbarui menjadi {status_data.status}"}
    
# --- ENDPOINT ADMIN: GET ALL USERS ---
@app.get("/admin/users")
async def get_all_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Akses ditolak. Khusus Admin.")
    
    users = db.query(models.User).order_by(models.User.id.desc()).all()
    
    return users

@app.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Akses ditolak.")
    
    user_to_delete = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
        
    # MANUAL CASCADE DELETE to avoid IntegrityError
    # 1. Delete Activity Logs
    db.query(models.ActivityLog).filter(models.ActivityLog.actor_id == user_to_delete.id).delete(synchronize_session=False)
    
    # 2. Delete Chat Sessions and Messages
    sessions = db.query(models.ChatSession).filter(models.ChatSession.user_id == user_to_delete.id).all()
    for s in sessions:
        db.query(models.ChatMessage).filter(models.ChatMessage.session_id == s.id).delete(synchronize_session=False)
    db.query(models.ChatSession).filter(models.ChatSession.user_id == user_to_delete.id).delete(synchronize_session=False)

    # 3. Delete Documents and Chunks
    docs = db.query(models.Document).filter(models.Document.uploader_id == user_to_delete.id).all()
    for d in docs:
        db.query(models.DocumentChunk).filter(models.DocumentChunk.document_id == d.id).delete(synchronize_session=False)
        db.query(models.ActivityLog).filter(models.ActivityLog.target_document_id == d.id).delete(synchronize_session=False)
        try:
            if d.file_path:
                filename = d.file_path.split("/")[-1]
                supabase_client.storage.from_("wikan_documents").remove([filename])
        except Exception:
            pass
    db.query(models.Document).filter(models.Document.uploader_id == user_to_delete.id).delete(synchronize_session=False)

    user_email = user_to_delete.email

    db.delete(user_to_delete)
    db.commit()
    
    # Catat activity
    db.add(models.ActivityLog(
        actor_id=current_user.id,
        action="Hapus Pengguna",
        details=f"Menghapus pengguna {user_email}"
    ))
    db.commit()
    return {"message": "Pengguna berhasil dihapus"}

@app.post("/admin/users", response_model=schemas.UserResponse)
async def create_admin_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Akses ditolak.")
        
    existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar.")
        
    hashed_pwd = utils.hash_password(user_in.password)
    new_user = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        role=models.UserRole.ADMIN,
        password_hash=hashed_pwd,
        status=models.UserStatus.ACTIVE
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    db.add(models.ActivityLog(
        actor_id=current_user.id,
        action="Tambah Admin",
        details=f"Menambahkan {new_user.email} sebagai admin"
    ))
    db.commit()
    return new_user

@app.put("/admin/users/{user_id}/block")
async def block_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Akses ditolak.")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
        
    # Toggle Ban
    if user.status == models.UserStatus.BANNED:
        user.status = models.UserStatus.ACTIVE
        action = "Unblock"
    else:
        user.status = models.UserStatus.BANNED
        action = "Blokir"
        
    db.commit()
    
    db.add(models.ActivityLog(
        actor_id=current_user.id,
        action=f"{action} Pengguna",
        details=f"{action} pengguna {user.email}"
    ))
    db.commit()
    return {"message": f"Pengguna berhasil di-{action.lower()}"}

@app.put("/admin/users/{user_id}/reset-password")
async def reset_password(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Akses ditolak.")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
        
    # Set to 'wikan123'
    user.password_hash = utils.hash_password("wikan123")
    db.commit()
    
    db.add(models.ActivityLog(
        actor_id=current_user.id,
        action="Reset Password",
        details=f"Mereset password {user.email}"
    ))
    db.commit()
    return {"message": "Password berhasil direset menjadi wikan123"}

@app.get("/admin/stats", response_model=schemas.AdminStatsResponse)
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Akses ditolak.")
        
    total_users = db.query(func.count(models.User.id)).scalar()
    total_docs = db.query(func.count(models.Document.id)).scalar()
    pending_docs = db.query(func.count(models.Document.id)).filter(models.Document.status == "PENDING").scalar()
    rejected_docs = db.query(func.count(models.Document.id)).filter(models.Document.status == "REJECTED").scalar()
    
    logs = db.query(models.ActivityLog).order_by(models.ActivityLog.timestamp.desc()).limit(5).all()
    recent_activities = []
    for log in logs:
        target_str = log.details or "-"
        if log.document:
            target_str = log.document.title
            
        type_str = "edit"
        if "Upload" in log.action: type_str = "upload"
        elif "Setuju" in log.action: type_str = "approve_file"
        elif "Tolak" in log.action: type_str = "reject_file"
        elif "Hapus" in log.action: type_str = "delete"
        
        recent_activities.append(
            schemas.ActivityResponse(
                id=log.id,
                action=log.action,
                target=target_str,
                time=utils.time_ago(log.timestamp),
                type=type_str
            )
        )
        
    return schemas.AdminStatsResponse(
        total_users=total_users or 0,
        total_documents=total_docs or 0,
        pending_documents=pending_docs or 0,
        rejected_documents=rejected_docs or 0,
        recent_activities=recent_activities
    )

@app.get("/chat/sessions", response_model=List[schemas.ChatSessionResponse])
async def get_chat_sessions(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    sessions = db.query(models.ChatSession).filter(models.ChatSession.user_id == current_user.id).order_by(models.ChatSession.created_at.desc()).all()
    res = []
    for s in sessions:
        res.append(
            schemas.ChatSessionResponse(
                id=str(s.id),
                title=s.title,
                isPinned=False,
                date=utils.time_ago(s.created_at)
            )
        )
    return res

@app.get("/chat/sessions/{session_id}/messages")
async def get_chat_session_messages(
    session_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id, 
        models.ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Sesi memori Obrolan tidak ditemukan.")
    
    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.session_id == session_id
    ).order_by(models.ChatMessage.timestamp.asc()).all()
    
    res = []
    for msg in messages:
        res.append({
            "id": msg.id,
            "sender": "user" if msg.sender == models.MessageSender.USER else "ai",
            "text": msg.content,
            "time": msg.timestamp.strftime("%I:%M %p") if msg.timestamp else ""
        })
    return res

class GuestChatRequest(BaseModel):
    question: str

@app.post("/chat/guest")
def chat_with_wikan_guest(request: GuestChatRequest):
    """
    Endpoint khusus untuk percakapan Guest tanpa menyimpan ke Database Memory.
    """
    if not request.question:
        raise HTTPException(status_code=400, detail="Pertanyaan tidak boleh kosong.")
    try:
        jawaban = get_answer_from_gemini(request.question)
        return {"status": "success", "answer": jawaban}
    except Exception as e:
        print(f"Error RAG /chat/guest: {str(e)}")
        raise HTTPException(status_code=500, detail="Maaf, Wikan sedang kesulitan memproses jawaban.")

@app.post("/chat")
async def chat_with_wikan(request: ChatRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Endpoint utama bagi user untuk bertanya seputar materi PDF dengan database Chat Memory.
    """
    if not request.question:
        raise HTTPException(status_code=400, detail="Pertanyaan tidak boleh kosong.")

    try:
        # Cek Pendaftaran Session Baru atau Lama
        session_id = request.session_id
        if not session_id:
            new_session = models.ChatSession(user_id=current_user.id, title=request.question[:50])
            db.add(new_session)
            db.commit()
            db.refresh(new_session)
            session_id = new_session.id
            
        # Verifikasi kepemilikan session
        chat_session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id, models.ChatSession.user_id == current_user.id).first()
        if not chat_session:
            raise HTTPException(status_code=404, detail="Sesi memori Obrolan tidak ditemukan atau Anda tidak berwenang mengaksesnya.")

        # Simpan Pertanyaan User ke Database Memory
        user_msg = models.ChatMessage(session_id=session_id, sender=models.MessageSender.USER, content=request.question)
        db.add(user_msg)
        db.commit()

        # Proses AI semantic search dengan Gemini
        jawaban = get_answer_from_gemini(request.question)
        
        # Simpan Jawaban AI ke Database Memory
        ai_msg = models.ChatMessage(session_id=session_id, sender=models.MessageSender.BOT, content=jawaban)
        db.add(ai_msg)
        db.commit()
        
        return {
            "status": "success",
            "session_id": session_id,
            "answer": jawaban
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error RAG /chat: {str(e)}")
        return {"status": "error", "message": "Maaf, Wikan sedang kesulitan memproses jawaban."}

@app.get("/admin/pending-documents", response_model=List[schemas.DocumentResponse])
async def list_pending_docs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Akses ditolak.")
        
    return db.query(models.Document).filter(models.Document.status == "pending").all()

# Endpoint untuk Eksekusi Approve/Reject
@app.post("/admin/documents/{doc_id}/decide")
async def decide_document(
    doc_id: int, 
    decision: str, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Validasi Admin
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Akses ditolak.")

    # Cari Dokumen
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan.")

    if decision.lower() == "approve":
        doc.status = models.DocumentStatus.APPROVED
        db.commit()
    
        print(f"🚀 Admin menyetujui {doc.title}. Menugaskan AI membaca ke Supabase PGVector...")
        background_tasks.add_task(process_document_for_ai, doc.file_path, doc.id)
        
        db.add(models.ActivityLog(
            actor_id=current_user.id,
            target_document_id=doc.id,
            action="Menyetujui Berkas",
            details="Dokumen mulai diproses AI"
        ))
        db.commit()
        
        return {"message": "Dokumen disetujui. AI sedang mempelajari isinya."}
    
    else:
        doc.status = models.DocumentStatus.REJECTED
        db.commit()
        
        db.add(models.ActivityLog(
            actor_id=current_user.id,
            target_document_id=doc.id,
            action="Menolak Berkas",
            details="Dokumen ditolak Admin"
        ))
        db.commit()
        return {"message": "Dokumen ditolak."}

@app.get("/contributor/activities", response_model=List[schemas.ActivityResponse])
async def get_contributor_activities(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "CONTRIBUTOR":
        raise HTTPException(status_code=403, detail="Hanya Contributor")
        
    logs = db.query(models.ActivityLog).filter(models.ActivityLog.actor_id == current_user.id).order_by(models.ActivityLog.timestamp.desc()).limit(10).all()
    res = []
    for log in logs:
        target_str = log.details or "-"
        if log.document:
            target_str = log.document.title
            
        type_str = "edit"
        if "Upload" in log.action: type_str = "upload"
        elif "Hapus" in log.action: type_str = "delete"
        
        res.append(
            schemas.ActivityResponse(
                id=log.id,
                action=log.action,
                target=target_str,
                time=utils.time_ago(log.timestamp),
                type=type_str
            )
        )
    return res