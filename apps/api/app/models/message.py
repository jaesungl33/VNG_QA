from sqlalchemy import Column, String, DateTime, func, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.database.connection import Base

class MessageRole(enum.Enum):
    user = "user"
    assistant = "assistant"

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id"), nullable=False)
    role = Column(Enum(MessageRole), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
