import os
import uuid
from pathlib import Path
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json
import uuid

from app.database.connection import get_db
from app import models, schemas
from app.services.embeddings.provider import get_provider

router = APIRouter()

class IndexingResponse(BaseModel):
    processed_files: int
    total_chunks: int
    message: str

class EmbeddingResponse(BaseModel):
    workspace_id: str
    total_chunks: int
    newly_embedded: int
    skipped: int

# Text file extensions to process for code indexing
TEXT_EXTENSIONS = {'.py', '.js', '.ts', '.tsx', '.jsx', '.java', '.cpp', '.c', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.sh', '.sql', '.yaml', '.yml', '.json', '.xml', '.html', '.css', '.scss', '.less', '.md', '.txt'}

# Directories to exclude from code walking
EXCLUDED_DIRS = {'node_modules', 'dist', 'build', '.git', '.svn', '__pycache__', '.next', '.nuxt', 'target', 'bin', 'obj'}

def chunk_text_by_chars(text: str, chunk_size: int = 1500, overlap: int = 200) -> List[tuple[str, int, int]]:
    """Chunk text by character count with overlap"""
    chunks = []
    start = 0

    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk_text = text[start:end]
        chunks.append((chunk_text, start, end))

        # Move start position with overlap, but ensure progress
        start = max(end - overlap, start + 1)

    return chunks

def chunk_file_by_lines(file_path: Path, lines_per_chunk: int = 120, overlap: int = 20) -> List[tuple[str, int, int]]:
    """Chunk file by line count with overlap"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
    except Exception:
        # Skip files that can't be read
        return []

    chunks = []
    total_lines = len(lines)
    start_line = 0

    while start_line < total_lines:
        end_line = min(start_line + lines_per_chunk, total_lines)
        chunk_lines = lines[start_line:end_line]
        chunk_text = ''.join(chunk_lines)
        chunks.append((chunk_text, start_line, end_line))

        # Move start position with overlap, but ensure progress
        start_line = max(end_line - overlap, start_line + 1)

    return chunks

def extract_text_from_file(file_path: Path) -> str:
    """Extract text content from a file"""
    try:
        if file_path.suffix.lower() == '.pdf':
            # For now, return placeholder for PDF
            raise NotImplementedError("PDF processing not implemented yet")

        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except NotImplementedError:
        raise
    except Exception as e:
        raise Exception(f"Failed to read file {file_path}: {str(e)}")

def walk_code_directory(base_path: Path) -> List[Path]:
    """Walk directory and find text files to process"""
    text_files = []

    for root, dirs, files in os.walk(base_path):
        # Remove excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]

        for file in files:
            file_path = Path(root) / file
            if file_path.suffix.lower() in TEXT_EXTENSIONS:
                text_files.append(file_path)

    return text_files

@router.post("/index/{workspace_id}/run", response_model=IndexingResponse)
async def run_indexing(workspace_id: str, db: Session = Depends(get_db)):
    """Run indexing on uploaded files in a workspace"""
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

    # Find files with status 'uploaded'
    uploaded_files = db.query(models.File).filter(
        models.File.workspace_id == workspace_uuid,
        models.File.status == models.FileStatus.uploaded
    ).all()

    if not uploaded_files:
        return IndexingResponse(
            processed_files=0,
            total_chunks=0,
            message="No uploaded files to process"
        )

    processed_files = 0
    total_chunks = 0

    for file_record in uploaded_files:
        try:
            # Update status to processing
            file_record.status = models.FileStatus.processing
            db.commit()

            chunks_created = 0

            if file_record.source_type == models.FileSourceType.doc:
                # Process document file
                if not file_record.file_path:
                    raise Exception("File path not set")

                file_path = Path(file_record.file_path)
                text_content = extract_text_from_file(file_path)

                # Chunk by characters
                text_chunks = chunk_text_by_chars(text_content)

                for i, (chunk_text, char_start, char_end) in enumerate(text_chunks):
                    chunk = models.Chunk(
                        file_id=file_record.id,
                        content=chunk_text.strip(),
                        chunk_index=i,
                        char_start=char_start,
                        char_end=char_end
                    )
                    db.add(chunk)
                    chunks_created += 1

            elif file_record.source_type == models.FileSourceType.code:
                # Process code snapshot
                if not file_record.file_path:
                    raise Exception("File path not set")

                base_path = Path(file_record.file_path)
                text_files = walk_code_directory(base_path)

                for file_path in text_files:
                    # Get relative path from extraction directory
                    try:
                        relative_path = file_path.relative_to(base_path)
                    except ValueError:
                        relative_path = file_path.name

                    # Chunk by lines
                    line_chunks = chunk_file_by_lines(file_path)

                    for i, (chunk_text, line_start, line_end) in enumerate(line_chunks):
                        chunk = models.Chunk(
                            file_id=file_record.id,
                            content=chunk_text.strip(),
                            chunk_index=chunks_created,
                            line_start=line_start,
                            line_end=line_end,
                            source_file_path=str(relative_path)
                        )
                        db.add(chunk)
                        chunks_created += 1

            # Update file status to ready
            file_record.status = models.FileStatus.ready
            file_record.error_message = None
            db.commit()

            processed_files += 1
            total_chunks += chunks_created

        except NotImplementedError as e:
            # Special handling for PDF files
            file_record.status = models.FileStatus.failed
            file_record.error_message = str(e)
            db.commit()

        except Exception as e:
            # Mark file as failed
            file_record.status = models.FileStatus.failed
            file_record.error_message = str(e)
            db.commit()

    return IndexingResponse(
        processed_files=processed_files,
        total_chunks=total_chunks,
        message=f"Indexing completed. Processed {processed_files} files, created {total_chunks} chunks."
    )

@router.post("/index/{workspace_id}/embed", response_model=EmbeddingResponse)
async def create_embeddings(workspace_id: str, db: Session = Depends(get_db)):
    """Create embeddings for chunks that don't have them yet"""
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

    # Get chunks that don't have embeddings yet
    chunks_without_embeddings = db.query(models.Chunk).filter(
        models.Chunk.file_id.in_(
            db.query(models.File.id).filter(
                models.File.workspace_id == workspace_uuid,
                models.File.status == models.FileStatus.ready
            )
        )
    ).outerjoin(models.Embedding, models.Chunk.id == models.Embedding.chunk_id).filter(
        models.Embedding.chunk_id.is_(None)
    ).all()

    if not chunks_without_embeddings:
        return EmbeddingResponse(
            workspace_id=workspace_id,
            total_chunks=0,
            newly_embedded=0,
            skipped=0
        )

    provider = get_provider()
    batch_size = 32
    newly_embedded = 0
    skipped = 0

    # Process chunks in batches
    for i in range(0, len(chunks_without_embeddings), batch_size):
        batch = chunks_without_embeddings[i:i + batch_size]

        # Get file info for each chunk
        chunk_file_map = {}
        for chunk in batch:
            file_info = db.query(models.File).filter(models.File.id == chunk.file_id).first()
            if file_info:
                chunk_file_map[chunk.id] = file_info

        # Extract texts for embedding
        texts = [chunk.content for chunk in batch]

        try:
            # Get embeddings for the batch
            embeddings = provider.embed_texts(texts)

            # Create embedding records
            for j, chunk in enumerate(batch):
                file_info = chunk_file_map.get(chunk.id)
                if file_info:
                    embedding_record = models.Embedding(
                        chunk_id=chunk.id,
                        workspace_id=workspace_uuid,
                        file_id=file_info.id,
                        embedding=json.dumps(embeddings[j]),
                        model=provider.model_name
                    )
                    db.add(embedding_record)
                    newly_embedded += 1
                else:
                    skipped += 1

            db.commit()

        except Exception as e:
            # Skip this batch on error
            skipped += len(batch)
            continue

    return EmbeddingResponse(
        workspace_id=workspace_id,
        total_chunks=len(chunks_without_embeddings),
        newly_embedded=newly_embedded,
        skipped=skipped
    )
