from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class ChatBase(BaseModel):
    title: str

class ChatCreate(ChatBase):
    workspace_id: uuid.UUID

class ChatUpdate(ChatBase):
    pass

class Chat(ChatBase):
    id: uuid.UUID
    workspace_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
