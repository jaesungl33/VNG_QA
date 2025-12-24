from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class ChunkBase(BaseModel):
    content: str
    chunk_index: int

class ChunkCreate(ChunkBase):
    file_id: uuid.UUID
    char_start: Optional[int] = None
    char_end: Optional[int] = None
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    source_file_path: Optional[str] = None
    section_title: Optional[str] = None

class Chunk(ChunkBase):
    id: uuid.UUID
    file_id: uuid.UUID
    char_start: Optional[int]
    char_end: Optional[int]
    line_start: Optional[int]
    line_end: Optional[int]
    source_file_path: Optional[str]
    section_title: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
