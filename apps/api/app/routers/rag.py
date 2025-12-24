from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Optional
import json
import uuid

from app.database.connection import get_db
from app import models, schemas
from app.services.embeddings.provider import get_provider

router = APIRouter()

class RagRetrieveRequest(BaseModel):
    workspace_id: str
    query: str
    scope: str = "both"  # "doc", "codebase", "both"
    file_slugs: Optional[List[str]] = None
    top_k: int = 12

class RagRetrievalResult(BaseModel):
    chunk_id: str
    file_id: str
    file_slug: str
    file_path: Optional[str]
    file_name: str
    source_type: str
    text: str
    char_start: Optional[int]
    char_end: Optional[int]
    line_start: Optional[int]
    line_end: Optional[int]
    score: float

class RagRetrieveResponse(BaseModel):
    results: List[RagRetrievalResult]
    total_found: int

def cosine_similarity(a: List[float], b: List[float]) -> float:
    """Calculate cosine similarity between two vectors"""
    dot_product = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(x * y for x, y in b) ** 0.5
    return dot_product / (norm_a * norm_b) if norm_a and norm_b else 0

@router.post("/rag/retrieve", response_model=RagRetrieveResponse)
async def retrieve_rag(request: RagRetrieveRequest, db: Session = Depends(get_db)):
    """Retrieve relevant chunks using vector similarity search"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    # Validate workspace
    try:
        workspace_uuid = uuid.UUID(request.workspace_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workspace ID")

    workspace = db.query(models.Workspace).filter(models.Workspace.id == workspace_uuid).first()
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Handle file slug filtering
    file_ids = []
    missing_slugs = []

    if request.file_slugs:
        for slug in request.file_slugs:
            file_record = db.query(models.File).filter(
                models.File.workspace_id == workspace_uuid,
                models.File.slug == slug
            ).first()

            if file_record:
                file_ids.append(file_record.id)
            else:
                # Try fuzzy matching for suggestions
                similar_files = db.query(models.File).filter(
                    models.File.workspace_id == workspace_uuid,
                    models.File.slug.ilike(f"%{slug}%")
                ).limit(3).all()

                suggestions = [f.slug for f in similar_files]
                missing_slugs.append({
                    "requested": slug,
                    "suggestions": suggestions
                })

        if missing_slugs:
            raise HTTPException(
                status_code=400,
                detail=f"Some file slugs not found: {missing_slugs}"
            )

    # Build query to get embeddings with file and chunk info
    query = db.query(
        models.Embedding,
        models.File,
        models.Chunk
    ).join(
        models.File, models.Embedding.file_id == models.File.id
    ).join(
        models.Chunk, models.Embedding.chunk_id == models.Chunk.id
    ).filter(
        models.Embedding.workspace_id == workspace_uuid
    )

    # Apply scope filtering
    if request.scope == "doc":
        query = query.filter(models.File.source_type == models.FileSourceType.doc)
    elif request.scope == "codebase":
        query = query.filter(models.File.source_type == models.FileSourceType.code)

    # Apply file filtering if specified
    if file_ids:
        query = query.filter(models.Embedding.file_id.in_(file_ids))

    embeddings_data = query.all()

    if not embeddings_data:
        return RagRetrieveResponse(results=[], total_found=0)

    # Embed the query
    provider = get_provider()
    query_embedding = provider.embed_query(request.query)

    # Calculate similarities (in Python since we don't have pgvector)
    similarities = []
    for embedding_record, file_record, chunk_record in embeddings_data:
        try:
            chunk_embedding = json.loads(embedding_record.embedding)
            similarity = cosine_similarity(query_embedding, chunk_embedding)

            similarities.append({
                'embedding': embedding_record,
                'file': file_record,
                'chunk': chunk_record,
                'score': similarity
            })
        except (json.JSONDecodeError, TypeError):
            continue

    # Sort by similarity and take top_k
    similarities.sort(key=lambda x: x['score'], reverse=True)
    top_results = similarities[:request.top_k]

    # Format results
    results = []
    for item in top_results:
        result = RagRetrievalResult(
            chunk_id=str(item['chunk'].id),
            file_id=str(item['file'].id),
            file_slug=item['file'].slug,
            file_path=item['file'].file_path,
            file_name=item['file'].name,
            source_type=item['file'].source_type.value,
            text=item['chunk'].content,
            char_start=item['chunk'].char_start,
            char_end=item['chunk'].char_end,
            line_start=item['chunk'].line_start,
            line_end=item['chunk'].line_end,
            score=item['score']
        )
        results.append(result)

    return RagRetrieveResponse(
        results=results,
        total_found=len(similarities)
    )
