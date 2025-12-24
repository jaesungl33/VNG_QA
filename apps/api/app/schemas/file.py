from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime
import uuid

class FileBase(BaseModel):
    name: str
    slug: str
    file_type: str
    size_bytes: Optional[int] = None

class FileCreate(FileBase):
    workspace_id: uuid.UUID
    source_type: Literal["doc", "code"]
    file_path: Optional[str] = None
    file_ext: Optional[str] = None
    mime_type: Optional[str] = None

class FileUpdate(BaseModel):
    status: Optional[Literal["uploaded", "processing", "ready", "failed"]] = None
    error_message: Optional[str] = None

class File(FileBase):
    id: uuid.UUID
    workspace_id: uuid.UUID
    source_type: Literal["doc", "code"]
    file_path: Optional[str]
    file_ext: Optional[str]
    mime_type: Optional[str]
    status: Literal["uploaded", "processing", "ready", "failed"]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
