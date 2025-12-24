from pydantic import BaseModel
from typing import List
from datetime import datetime
import uuid

class EmbeddingBase(BaseModel):
    chunk_id: uuid.UUID
    workspace_id: uuid.UUID
    file_id: uuid.UUID
    embedding: List[float]
    model: str

class Embedding(EmbeddingBase):
    created_at: datetime

    class Config:
        from_attributes = True

class EmbeddingBatchCreate(BaseModel):
    embeddings: List[EmbeddingBase]
