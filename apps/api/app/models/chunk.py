from sqlalchemy import Column, String, Integer, DateTime, func, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database.connection import Base

class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id"), nullable=False)
    content = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    char_start = Column(Integer)
    char_end = Column(Integer)
    line_start = Column(Integer)
    line_end = Column(Integer)
    source_file_path = Column(String)  # For code chunks: relative path within the extracted zip
    section_title = Column(String)  # For future use
    created_at = Column(DateTime(timezone=True), server_default=func.now())
