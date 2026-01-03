import os
from fastapi import FastAPI
from contextlib import asynccontextmanager
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, upload  # Updated
from app.db import engine, Base    # Updated
from app import models             # Updated1

print("DATABASE_URL =", os.getenv("DATABASE_URL"))
# 1. FORCE CREATION AT TOP LEVEL (More reliable for Vercel)
print("LOG: Application Startup - Initializing Database...")
try:
    with engine.begin() as conn:
        Base.metadata.create_all(bind=conn)
        #Base.metadata.create_all(bind=engine)
        print("LOG: Database tables verified/created.")
except Exception as e:
    print(f"LOG: DATABASE ERROR: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # We already created tables above, but we keep this for structure
    yield

app = FastAPI(lifespan=lifespan, title="FIFO SaaS API")
app.include_router(auth.router)
app.include_router(upload.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://trading-desk-pb845.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/db-check")
async def db_check():
    try:
        from sqlalchemy import text
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "connected", "database": str(engine.url.database)}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/health")
async def health():
    return {"status": "ok"}
