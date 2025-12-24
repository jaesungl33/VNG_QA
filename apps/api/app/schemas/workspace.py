from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class WorkspaceBase(BaseModel):
    name: str
    description: Optional[str] = None

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceUpdate(WorkspaceBase):
    pass

class Workspace(WorkspaceBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
