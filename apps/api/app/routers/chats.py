from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from app.database.connection import get_db
from app import models, schemas

router = APIRouter()

@router.get("/workspaces/{workspace_id}/chats", response_model=List[schemas.Chat])
async def get_chats(workspace_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get all chats in a workspace"""
    if db is None:
        # Return mock data if database is not available
        return []

    chats = db.query(models.Chat).filter(models.Chat.workspace_id == workspace_id).all()
    return chats

@router.get("/workspaces/{workspace_id}/chats/{chat_id}", response_model=schemas.Chat)
async def get_chat(workspace_id: uuid.UUID, chat_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a specific chat"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    chat = db.query(models.Chat).filter(
        models.Chat.id == chat_id,
        models.Chat.workspace_id == workspace_id
    ).first()
    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat

@router.post("/workspaces/{workspace_id}/chats", response_model=schemas.Chat)
async def create_chat(
    workspace_id: uuid.UUID,
    chat: schemas.ChatCreate,
    db: Session = Depends(get_db)
):
    """Create a new chat in a workspace"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    # Verify workspace exists
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Create chat
    db_chat = models.Chat(**chat.dict())
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    return db_chat

@router.put("/workspaces/{workspace_id}/chats/{chat_id}", response_model=schemas.Chat)
async def update_chat(
    workspace_id: uuid.UUID,
    chat_id: uuid.UUID,
    chat_update: schemas.ChatUpdate,
    db: Session = Depends(get_db)
):
    """Update a chat"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    chat = db.query(models.Chat).filter(
        models.Chat.id == chat_id,
        models.Chat.workspace_id == workspace_id
    ).first()
    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found")

    for field, value in chat_update.dict(exclude_unset=True).items():
        setattr(chat, field, value)

    db.commit()
    db.refresh(chat)
    return chat

@router.delete("/workspaces/{workspace_id}/chats/{chat_id}")
async def delete_chat(workspace_id: uuid.UUID, chat_id: uuid.UUID, db: Session = Depends(get_db)):
    """Delete a chat"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    chat = db.query(models.Chat).filter(
        models.Chat.id == chat_id,
        models.Chat.workspace_id == workspace_id
    ).first()
    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found")

    db.delete(chat)
    db.commit()
    return {"message": "Chat deleted"}
