from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, upload
app = FastAPI(title="FIFO SaaS API")
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
