from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv, find_dotenv

# Load .env from the project regardless of current working directory
load_dotenv(find_dotenv())

# Default to a local SQLite DB for easy local runs without Docker.
# Override with DATABASE_URL in .env to use Postgres or another DB.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./marketpulse.db")

# SQLite needs a special connect arg for multi-threaded FastAPI usage
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
