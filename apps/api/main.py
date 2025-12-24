from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routers
from app.routers import health, workspaces, files, chats, messages, uploads, indexing, rag

# Create FastAPI app
app = FastAPI(
    title="VNG QA API",
    description="AI-powered Q&A system for game designers and developers",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api")
app.include_router(workspaces.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(chats.router, prefix="/api")
app.include_router(messages.router, prefix="/api")
app.include_router(uploads.router, prefix="/api")
app.include_router(indexing.router, prefix="/api")
app.include_router(rag.router, prefix="/api")

# Root endpoint
@app.get("/")
async def root():
    return {"message": "VNG QA API", "version": "0.1.0"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
