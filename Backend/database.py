import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import urllib.parse

load_dotenv()

# --- STEP 1: Check if we are on Render (Cloud) or Local ---
# Render provides the URL in a variable called "DATABASE_URL"
DATABASE_URL = os.getenv("DATABASE_URL")

# If there is no DATABASE_URL (meaning we are running locally), build it manually
if not DATABASE_URL:
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASS = os.getenv("DB_PASS", "postgres@123")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_NAME = os.getenv("DB_NAME", "eduai_db")
    DB_PORT = os.getenv("DB_PORT", "5432")

    safe_password = urllib.parse.quote_plus(DB_PASS)
    DATABASE_URL = f"postgresql://{DB_USER}:{safe_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# --- STEP 2: Fix the Render URL format ---
# Render starts URLs with "postgres://", but SQLAlchemy needs "postgresql://"
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# --- STEP 3: Create the Engine ---
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()