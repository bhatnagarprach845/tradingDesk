from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from .fifo_engine import parse_csv_text, fifo_match_with_lot_ids, reset_lot_counter
from typing import List
import json
from datetime import datetime

router = APIRouter()

# Simple in-memory store for demo purposes; replace with DB for production
IN_MEMORY_RESULTS = {}

def _sort_by_ts(rows):
    try:
        return sorted(rows, key=lambda x: datetime.fromisoformat(x["ts"]))
    except Exception:
        return sorted(rows, key=lambda x: x["ts"])

@router.post("/upload_csv")
async def upload_csv(file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode("utf-8")
    rows = parse_csv_text(text)

    if not rows:
        raise HTTPException(400, "No valid transactions parsed")

    # group by symbol
    groups = {}
    for t in rows:
        sym = t.get("symbol") or "__DEFAULT__"
        groups.setdefault(sym, []).append(t)

    reset_lot_counter()
    all_matches = []
    all_remaining = []
    total_realized = 0.0

    for sym, txs in groups.items():
        txs_sorted = _sort_by_ts(txs)
        res = fifo_match_with_lot_ids(txs_sorted)
        for m in res["matches"]:
            all_matches.append(m)
        for r in res["remaining_lots"]:
            all_remaining.append(r)
        total_realized += res["total_realized_pnl"]

    result_id = f"r{len(IN_MEMORY_RESULTS) + 1}"
    out = {"matches": all_matches, "remaining_lots": all_remaining,
           "total_realized_pnl": round(total_realized, 10)}
    IN_MEMORY_RESULTS[result_id] = out

    return {"result_id": result_id, "summary": {"matches": len(all_matches),
                                                "remaining": len(all_remaining),
                                                "total_realized_pnl": out["total_realized_pnl"]}}

@router.get("/results/{result_id}")
async def get_results(result_id: str):
    res = IN_MEMORY_RESULTS.get(result_id)
    if not res:
        raise HTTPException(404, "result not found")
    return res
