
# backend/app/db.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# Ensure the .env file is loaded here to get DATABASE_URL
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Create the engine, using pool_pre_ping for stable connections to serverless DBs like Neon
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

# Configure the SessionLocal class to manage transactions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for your models
Base = declarative_base()

# Dependency to get a database session (used in FastAPI endpoints)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
