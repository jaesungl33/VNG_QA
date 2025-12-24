from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/vng_qa")

try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
except Exception as e:
    print(f"Warning: Could not connect to database: {e}")
    print("Application will continue with limited functionality.")
    engine = None
    SessionLocal = None
    Base = declarative_base()

def get_db():
    """Dependency to get database session"""
    if SessionLocal is None:
        # Return a mock session if database is not available
        return None

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
