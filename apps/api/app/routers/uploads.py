import os
import uuid
import zipfile
import mimetypes
from pathlib import Path
from typing import Literal
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.connection import get_db
from app import models, schemas

router = APIRouter()

# Safe file type allowlists
ALLOWED_DOC_TYPES = {
    'text/plain', 'text/markdown', 'application/pdf'
}
ALLOWED_DOC_EXTENSIONS = {'.txt', '.md', '.pdf'}

ALLOWED_ZIP_TYPES = {'application/zip', 'application/x-zip-compressed'}
ALLOWED_ZIP_EXTENSIONS = {'.zip'}

class UploadResponse(BaseModel):
    file_id: str
    message: str

def get_file_info(filename: str) -> tuple[str, str, str]:
    """Extract file extension and MIME type from filename"""
    file_ext = Path(filename).suffix.lower()
    mime_type, _ = mimetypes.guess_type(filename)
    mime_type = mime_type or 'application/octet-stream'
    return file_ext, mime_type

def create_upload_directory(workspace_id: str, file_type: str, file_id: str) -> Path:
    """Create and return upload directory path"""
    base_path = Path("apps/api/data")
    if file_type == "doc":
        upload_path = base_path / "workspaces" / str(workspace_id) / "uploads" / str(file_id)
    else:  # code
        upload_path = base_path / "workspaces" / str(workspace_id) / "repos" / str(file_id)

    upload_path.mkdir(parents=True, exist_ok=True)
    return upload_path

def validate_file_type(file: UploadFile, allowed_types: set, allowed_extensions: set) -> None:
    """Validate file type and extension"""
    file_ext = Path(file.filename).suffix.lower()
    mime_type = file.content_type or 'application/octet-stream'

    if mime_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type {mime_type} not allowed. Allowed types: {', '.join(allowed_types)}"
        )

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File extension {file_ext} not allowed. Allowed extensions: {', '.join(allowed_extensions)}"
        )

@router.post("/files/upload/doc", response_model=UploadResponse)
async def upload_doc_file(
    workspace_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a document file (txt, md, pdf)"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    # Validate workspace exists
    try:
        workspace_uuid = uuid.UUID(workspace_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workspace ID")

    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_uuid).first()
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Validate file type
    validate_file_type(file, ALLOWED_DOC_TYPES, ALLOWED_DOC_EXTENSIONS)

    # Create file record
    file_id = uuid.uuid4()
    file_ext, mime_type = get_file_info(file.filename)

    db_file = models.File(
        id=file_id,
        workspace_id=workspace_uuid,
        name=file.filename,
        slug=file.filename,  # For now, slug is same as filename
        file_type=file_ext[1:] if file_ext else 'unknown',  # Remove leading dot
        size_bytes=0,  # Will be updated after upload
        source_type=models.FileSourceType.doc,
        file_ext=file_ext,
        mime_type=mime_type,
        status=models.FileStatus.uploaded
    )

    # Create upload directory and save file
    upload_dir = create_upload_directory(workspace_id, "doc", str(file_id))
    file_path = upload_dir / file.filename

    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        # Update file record with actual size and path
        db_file.file_path = str(file_path)
        db_file.size_bytes = len(content)

        db.add(db_file)
        db.commit()
        db.refresh(db_file)

    except Exception as e:
        # Clean up on error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    return UploadResponse(
        file_id=str(file_id),
        message=f"Document '{file.filename}' uploaded successfully"
    )

@router.post("/files/upload/codezip", response_model=UploadResponse)
async def upload_code_zip(
    workspace_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a code zip file and extract it"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    # Validate workspace exists
    try:
        workspace_uuid = uuid.UUID(workspace_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workspace ID")

    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_uuid).first()
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Validate file type
    validate_file_type(file, ALLOWED_ZIP_TYPES, ALLOWED_ZIP_EXTENSIONS)

    # Create snapshot ID and file record
    snapshot_id = uuid.uuid4()
    file_ext, mime_type = get_file_info(file.filename)

    db_file = models.File(
        id=snapshot_id,
        workspace_id=workspace_uuid,
        name="code_snapshot.zip",
        slug=f"code_snapshot_{snapshot_id}",
        file_type="zip",
        size_bytes=0,  # Will be updated after upload
        source_type=models.FileSourceType.code,
        file_ext=file_ext,
        mime_type=mime_type,
        status=models.FileStatus.uploaded
    )

    # Create extraction directory
    extract_dir = create_upload_directory(workspace_id, "code", str(snapshot_id))

    try:
        content = await file.read()

        # Save zip file
        zip_path = extract_dir / "snapshot.zip"
        with open(zip_path, "wb") as f:
            f.write(content)

        # Extract zip file
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)

        # Update file record
        db_file.file_path = str(extract_dir)
        db_file.size_bytes = len(content)

        db.add(db_file)
        db.commit()
        db.refresh(db_file)

    except zipfile.BadZipFile:
        # Clean up on error
        if extract_dir.exists():
            import shutil
            shutil.rmtree(extract_dir)
        raise HTTPException(status_code=400, detail="Invalid zip file")
    except Exception as e:
        # Clean up on error
        if extract_dir.exists():
            import shutil
            shutil.rmtree(extract_dir)
        raise HTTPException(status_code=500, detail=f"Failed to extract zip file: {str(e)}")

    return UploadResponse(
        file_id=str(snapshot_id),
        message=f"Code snapshot extracted to {extract_dir}"
    )
