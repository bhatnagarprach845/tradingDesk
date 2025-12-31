from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, upload
from app.db import engine, Base
from app import models  # <--- CRITICAL: MUST IMPORT MODELS HERE

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("LOG: Lifespan starting - Creating tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("LOG: Tables created successfully or already exist.")
    except Exception as e:
        print(f"LOG: Error creating tables: {e}")
    yield
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
