from sqlalchemy import Column, Text, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database.connection import Base

class Embedding(Base):
    __tablename__ = "embeddings"

    chunk_id = Column(UUID(as_uuid=True), primary_key=True)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id"), nullable=False)
    embedding = Column(Text, nullable=False)  # Store as JSON array string
    model = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
