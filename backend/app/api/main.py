import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, upload
from app.db import user_table # Import the table resource directly

# We use a simple FastAPI instance.
# Lifespan is optional here since DynamoDB doesn't require a connection pool.
app = FastAPI(title="FIFO SaaS API")

# --- MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTERS ---
app.include_router(auth.router)
app.include_router(upload.router)

# --- DIAGNOSTIC ENDPOINTS ---

@app.get("/db-check")
async def db_check():
    """
    Verifies that the Lambda/Server can actually communicate with DynamoDB.
    """
    try:
        # We check the table status (e.g., 'ACTIVE')
        status = user_table.table_status
        return {
            "status": "connected",
            "table_name": user_table.name,
            "table_status": status
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "tip": "Check IAM permissions or Local DynamoDB Docker container."
        }

@app.get("/health")
async def health():
    """Basic health check for Vercel/Amplify."""
    return {"status": "ok", "environment": os.getenv("PROD_ENV", "development")}