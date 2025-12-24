from pydantic import BaseModel
from typing import Literal
from datetime import datetime
import uuid

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: uuid.UUID
    chat_id: uuid.UUID
    role: Literal["user", "assistant"]
    created_at: datetime

    class Config:
        from_attributes = True
