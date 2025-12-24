from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from app.database.connection import get_db
from app import models, schemas

router = APIRouter()

@router.get("/workspaces/{workspace_id}/chats/{chat_id}/messages", response_model=List[schemas.Message])
async def get_messages(workspace_id: uuid.UUID, chat_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get all messages in a chat"""
    if db is None:
        # Return mock data if database is not available
        return []

    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.chat_id == chat_id
    ).order_by(models.ChatMessage.created_at).all()
    return messages

@router.post("/workspaces/{workspace_id}/chats/{chat_id}/messages", response_model=schemas.Message)
async def send_message(
    workspace_id: uuid.UUID,
    chat_id: uuid.UUID,
    message: schemas.MessageCreate,
    db: Session = Depends(get_db)
):
    """Send a message and get assistant response"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    # Verify chat exists and belongs to workspace
    chat = db.query(models.Chat).filter(
        models.Chat.id == chat_id,
        models.Chat.workspace_id == workspace_id
    ).first()
    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Create user message
    user_message = models.ChatMessage(
        chat_id=chat_id,
        role=models.MessageRole.user,
        content=message.content
    )
    db.add(user_message)

    # Create assistant response (dummy echo for now)
    assistant_content = f"I received your message: '{message.content}'. This is a placeholder response. RAG functionality will be implemented later."

    assistant_message = models.ChatMessage(
        chat_id=chat_id,
        role=models.MessageRole.assistant,
        content=assistant_content
    )
    db.add(assistant_message)

    db.commit()
    db.refresh(assistant_message)

    return assistant_message
