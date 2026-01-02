from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# Load .env only locally
if os.getenv("VERCEL_ENV") != "production":
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Local fallback (explicit, not silent)
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./fifo_demo.db"
    print("⚠️ DATABASE_URL not set, using SQLite for local dev")

# Fix old postgres:// URLs
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print("USING DATABASE_URL =", DATABASE_URL)

IS_PROD = os.getenv("VERCEL_ENV") == "production"

engine_args = {}
if DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}
else:
    engine_args["pool_pre_ping"] = True
    engine_args["pool_recycle"] = 300

engine = create_engine(
    DATABASE_URL,
    echo=not IS_PROD,
    **engine_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
