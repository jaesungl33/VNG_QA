from sqlalchemy import Column, String, Integer, DateTime, func, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.database.connection import Base

class FileSourceType(enum.Enum):
    doc = "doc"
    code = "code"

class FileStatus(enum.Enum):
    uploaded = "uploaded"
    processing = "processing"
    ready = "ready"
    failed = "failed"

class File(Base):
    __tablename__ = "files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    name = Column(String, nullable=False)
    slug = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    size_bytes = Column(Integer)
    source_type = Column(Enum(FileSourceType), nullable=False)
    file_path = Column(String)
    file_ext = Column(String)
    mime_type = Column(String)
    status = Column(Enum(FileStatus), default=FileStatus.uploaded)
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
