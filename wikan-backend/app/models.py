import uuid
from datetime import datetime
import enum
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .database import Base

# ── Import pgvector untuk kolom tipe Vector ───────────────────────────────────
from pgvector.sqlalchemy import Vector


# --- ENUMS ---
class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    CONTRIBUTOR = "CONTRIBUTOR"
    STUDENT = "STUDENT"

class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PENDING = "PENDING"
    SUSPENDED = "SUSPENDED"
    BANNED = "BANNED"

class DocumentStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    FLAGGED = "FLAGGED"

class MessageSender(str, enum.Enum):
    USER = "USER"
    BOT = "BOT"

# --- MODEL TABEL ---

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False) 
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    
    # --- DATA KHUSUS CONTRIBUTOR ---
    institution = Column(String, nullable=True) 
    profession = Column(String, nullable=True)    
    phone_number = Column(String, nullable=True)  
    lecturer_id_proof = Column(String, nullable=True) 
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    documents = relationship("Document", back_populates="uploader")
    logs = relationship("ActivityLog", back_populates="actor")
    chat_sessions = relationship("ChatSession", back_populates="user")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    
    title = Column(String, nullable=False)       
    description = Column(Text, nullable=True)     
    
    file_path = Column(String, nullable=False)   
    file_type = Column(String, nullable=True)     
    file_size = Column(Integer, nullable=True)    
    
    status = Column(Enum(DocumentStatus), default=DocumentStatus.PENDING)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    uploader_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    uploader = relationship("User", back_populates="documents")
    logs = relationship("ActivityLog", back_populates="document")

    # ── Relasi ke potongan-potongan teks (chunks) dokumen ──────────────────────
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    """
    Tabel baru untuk menyimpan potongan teks (chunks) dari PDF 
    beserta vektor embedding-nya dari Gemini Text Embedding API.
    
    Ini adalah jantung dari sistem RAG (Retrieval-Augmented Generation):
    - Saat dokumen di-approve, PDF dipotong menjadi chunk-chunk kecil
    - Setiap chunk diubah menjadi vektor 768 dimensi oleh Gemini
    - Vektor disimpan di kolom `embedding` bertipe pgvector
    - Saat user bertanya, pertanyaan juga diubah jadi vektor,
      lalu dicari chunk yang paling mirip (cosine similarity)
    """
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)

    # Relasi ke dokumen induk
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    document = relationship("Document", back_populates="chunks")

    # Teks asli dari potongan PDF
    content = Column(Text, nullable=False)

    # Urutan chunk dalam dokumen (untuk konteks yang lebih baik)
    chunk_index = Column(Integer, nullable=True)

    # ── KOLOM VEKTOR (pgvector) ────────────────────────────────────────────────
    # 3072 dimensi = ukuran output standar dari model gemini-embedding-001/preview
    # Nilai ini HARUS sama dengan dimensi yang dikembalikan oleh API
    embedding = Column(Vector(3072), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    target_document_id = Column(Integer, ForeignKey("documents.id"), nullable=True) 
    
    action = Column(String)
    details = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    actor = relationship("User", back_populates="logs")
    document = relationship("Document", back_populates="logs")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    title = Column(String, default="Percakapan Baru")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    
    sender = Column(Enum(MessageSender), default=MessageSender.USER)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")