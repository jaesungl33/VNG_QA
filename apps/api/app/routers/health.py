from fastapi import APIRouter
from datetime import datetime
from app.schemas.health import HealthCheck

router = APIRouter()

@router.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    return HealthCheck(
        status="healthy",
        timestamp=datetime.utcnow()
    )
