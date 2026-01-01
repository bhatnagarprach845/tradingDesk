import os
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, upload

# Use relative imports if files are in the same directory
from app.db import engine, Base
from app import models

# 1. FORCE CREATION AT TOP LEVEL (More reliable for Vercel)
print("LOG: Application Startup - Initializing Database...")
try:
    Base.metadata.create_all(bind=engine)
    print("LOG: Database tables verified/created.")
except Exception as e:
    print(f"LOG: DATABASE ERROR: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # We already created tables above, but we keep this for structure
    yield

app = FastAPI(lifespan=lifespan, title="FIFO SaaS API")

# 2. Add a specialized DB check route
@app.get("/db-check")
async def db_check():
    try:
        from sqlalchemy import text
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "connected", "database": str(engine.url.database)}
    except Exception as e:
        return {"status": "error", "message": str(e)}
app = FastAPI(lifespan=lifespan,title="FIFO SaaS API")
app.include_router(auth.router)
app.include_router(upload.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/health")
async def health():
    return {"status": "ok"}
