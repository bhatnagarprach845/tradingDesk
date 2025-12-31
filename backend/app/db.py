from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fifo_demo.db")

# 2. Fix for Heroku/Postgres prefix (if needed)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 3. Detect if we are in production to toggle 'echo'
IS_PROD = os.getenv("VERCEL_ENV") == "production"

# # SQLite echo is helpful in dev; switch off in production
# engine = create_engine(
#     DATABASE_URL,
#     connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
# )

# 4. Create the Engine
# 'connect_args' is ONLY needed for SQLite
engine_args = {}
if DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    echo=not IS_PROD,  # SQL logging: ON for dev, OFF for prod
    **engine_args
)

# Session and Base setup
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
