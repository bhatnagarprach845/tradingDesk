from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import uuid
import io
import csv

from app.db import SessionLocal
from app.models import User
from app.api.auth import get_current_user
from app.fifo_engine import parse_csv_text, fifo_match_with_lot_ids

router = APIRouter(prefix="/upload", tags=["Upload"])

# ------------------------
# OPTIONAL: Stripe usage reporting
# ------------------------
try:
    from app.billing import report_usage_if_needed
except Exception:
    report_usage_if_needed = None


# ------------------------
# DB dependency
# ------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ------------------------
# SIMPLE IN-MEMORY CACHE
# ------------------------
# { user_id: { "matches": [...], "remaining": [...] } }
FIFO_CACHE = {}


def rows_to_csv_response(rows: list[dict], filename: str):
    buffer = io.StringIO()

    if not rows:
        buffer.write("No data\n")
    else:
        writer = csv.DictWriter(buffer, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )


# ------------------------
# Upload CSV endpoint
# ------------------------
@router.post("/upload_csv")
async def upload_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload CSV → FIFO match → cache → preview + download endpoints
    """

    content = await file.read()
    text = content.decode("utf-8")

    transactions = parse_csv_text(text)
    if not transactions:
        raise HTTPException(
            status_code=400,
            detail="No valid transactions found",
        )

    transactions_sorted = sorted(transactions, key=lambda x: x["ts"])

    result = fifo_match_with_lot_ids(transactions_sorted)

    matches = result.get("matches", [])
    remaining_lots = result.get("remaining_lots", [])

    # ---- Cache per user ----
    FIFO_CACHE[current_user.id] = {
        "matches": matches,
        "remaining": remaining_lots,
    }

    # ---- Metered billing ----
    if report_usage_if_needed:
        try:
            report_usage_if_needed(
                user=current_user,
                quantity=len(transactions_sorted),
                idempotency_key=str(uuid.uuid4()),
            )
        except Exception as e:
            print("Billing usage error:", e)

    return {
        "transactions": len(transactions_sorted),
        "total_realized_pnl": result.get("total_realized_pnl", 0),
        "preview": {
            "matches": matches[:50],
            "remaining_lots": remaining_lots[:50],
        },
        "downloads": {
            "matched_lots": "/upload/download/matched",
            "remaining_lots": "/upload/download/remaining",
        },
    }


# ------------------------
# DOWNLOAD: MATCHED LOTS
# ------------------------
@router.get("/download/matched")
def download_matched(
    current_user: User = Depends(get_current_user),
):
    data = FIFO_CACHE.get(current_user.id)

    if not data or not data.get("matches"):
        raise HTTPException(status_code=404, detail="No matched lots available")

    return rows_to_csv_response(
        data["matches"],
        filename="fifo_matched_lots.csv",
    )


# ------------------------
# DOWNLOAD: REMAINING LOTS
# ------------------------
@router.get("/download/remaining")
def download_remaining(
    current_user: User = Depends(get_current_user),
):
    data = FIFO_CACHE.get(current_user.id)

    if not data or not data.get("remaining"):
        raise HTTPException(status_code=404, detail="No remaining lots available")

    return rows_to_csv_response(
        data["remaining"],
        filename="fifo_remaining_lots.csv",
    )
