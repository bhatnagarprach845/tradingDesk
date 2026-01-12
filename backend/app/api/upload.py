# backend/app/api/upload.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
import uuid
import io
import csv

from app.api.auth import get_current_user
from app.fifo_engine import parse_csv_text, fifo_match_with_lot_ids

router = APIRouter(prefix="/upload", tags=["Upload"])


# Remove the get_db function and db: Session dependencies

@router.post("/upload_csv")
async def upload_csv(
        file: UploadFile = File(...),
        current_user: dict = Depends(get_current_user),  # current_user is now a dict from DynamoDB
):
    content = await file.read()
    text = content.decode("utf-8")

    # ... keep your existing FIFO logic ...

    # Use current_user['email'] instead of current_user.id for the cache key
    user_key = current_user['email']
    # FIFO_CACHE[user_key] = ...

    return {"message": "Success", "user": user_key}