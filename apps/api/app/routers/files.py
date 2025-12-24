from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from app.database.connection import get_db
from app import models, schemas

router = APIRouter()

@router.get("/workspaces/{workspace_id}/files", response_model=List[schemas.File])
async def get_files(workspace_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get all files in a workspace"""
    if db is None:
        # Return mock data if database is not available
        return []

    files = db.query(models.File).filter(models.File.workspace_id == workspace_id).all()
    return files

@router.get("/workspaces/{workspace_id}/files/{file_id}", response_model=schemas.File)
async def get_file(workspace_id: uuid.UUID, file_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a specific file"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    file = db.query(models.File).filter(
        models.File.id == file_id,
        models.File.workspace_id == workspace_id
    ).first()
    if file is None:
        raise HTTPException(status_code=404, detail="File not found")
    return file

@router.post("/workspaces/{workspace_id}/files", response_model=schemas.File)
async def create_file(
    workspace_id: uuid.UUID,
    file: schemas.FileCreate,
    db: Session = Depends(get_db)
):
    """Create a new file in a workspace"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    # Verify workspace exists
    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_id).first()
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Create file
    db_file = models.File(**file.dict())
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file

@router.put("/workspaces/{workspace_id}/files/{file_id}", response_model=schemas.File)
async def update_file(
    workspace_id: uuid.UUID,
    file_id: uuid.UUID,
    file_update: schemas.FileUpdate,
    db: Session = Depends(get_db)
):
    """Update a file"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    file = db.query(models.File).filter(
        models.File.id == file_id,
        models.File.workspace_id == workspace_id
    ).first()
    if file is None:
        raise HTTPException(status_code=404, detail="File not found")

    for field, value in file_update.dict(exclude_unset=True).items():
        setattr(file, field, value)

    db.commit()
    db.refresh(file)
    return file

@router.delete("/workspaces/{workspace_id}/files/{file_id}")
async def delete_file(workspace_id: uuid.UUID, file_id: uuid.UUID, db: Session = Depends(get_db)):
    """Delete a file"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    file = db.query(models.File).filter(
        models.File.id == file_id,
        models.File.workspace_id == workspace_id
    ).first()
    if file is None:
        raise HTTPException(status_code=404, detail="File not found")

    db.delete(file)
    db.commit()
    return {"message": "File deleted"}
