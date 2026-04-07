from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum
from uuid import UUID
from datetime import datetime


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    CONTRIBUTOR = "CONTRIBUTOR"
    STUDENT = "STUDENT"

# Base Schema
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole

# Schema Register
class UserCreate(UserBase):
    password: str
    
    institution: Optional[str] = None
    profession: Optional[str] = None
    phone_number: Optional[str] = None

# Schema Response
class UserResponse(UserBase):
    id: UUID
    institution: Optional[str] = None
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Base Schema
class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None

# Schema untuk Response 
class DocumentResponse(DocumentBase):
    id: int
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    status: str
    created_at: datetime
    uploader_id: UUID 

    class Config:
        from_attributes = True 

class ActivityResponse(BaseModel):
    id: int
    action: str
    target: Optional[str] = None
    time: str
    type: str

    class Config:
        from_attributes = True

class AdminStatsResponse(BaseModel):
    total_users: int
    total_documents: int
    pending_documents: int
    rejected_documents: int
    recent_activities: list[ActivityResponse]

class ChatSessionResponse(BaseModel):
    id: str
    title: str
    isPinned: bool
    date: str

    class Config:
        from_attributes = True