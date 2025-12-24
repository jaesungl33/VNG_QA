from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime
from app.database.connection import get_db
from app import models, schemas

router = APIRouter()

@router.get("/workspaces", response_model=List[schemas.Workspace])
async def get_workspaces(db: Session = Depends(get_db)):
    """Get all workspaces"""
    if db is None:
        # Return mock data if database is not available
        return [
            schemas.Workspace(
                id=uuid.uuid4(),
                name="Sample Workspace",
                description="This is a sample workspace",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
        ]

    workspaces = db.query(models.Workspace).all()
    return workspaces

@router.get("/workspaces/{workspace_id}", response_model=schemas.Workspace)
async def get_workspace(workspace_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a specific workspace"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace

@router.post("/workspaces", response_model=schemas.Workspace)
async def create_workspace(workspace: schemas.WorkspaceCreate, db: Session = Depends(get_db)):
    """Create a new workspace"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    db_workspace = models.Workspace(**workspace.dict())
    db.add(db_workspace)
    db.commit()
    db.refresh(db_workspace)
    return db_workspace

@router.put("/workspaces/{workspace_id}", response_model=schemas.Workspace)
async def update_workspace(
    workspace_id: uuid.UUID,
    workspace_update: schemas.WorkspaceUpdate,
    db: Session = Depends(get_db)
):
    """Update a workspace"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")

    for field, value in workspace_update.dict(exclude_unset=True).items():
        setattr(workspace, field, value)

    db.commit()
    db.refresh(workspace)
    return workspace

@router.delete("/workspaces/{workspace_id}")
async def delete_workspace(workspace_id: uuid.UUID, db: Session = Depends(get_db)):
    """Delete a workspace"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")

    db.delete(workspace)
    db.commit()
    return {"message": "Workspace deleted"}
