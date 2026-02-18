"""
Extracted FIFO engine and CSV parser.
Put your original logic here with small enhancements for importability.
"""
from io import StringIO
import csv
import itertools
from math import isclose
from datetime import datetime

DEFAULT_SYMBOL = "__DEFAULT__"
_lot_id_counter = itertools.count(1)

def _next_lot_id():
    return f"L{next(_lot_id_counter)}"

def reset_lot_counter():
    global _lot_id_counter
    _lot_id_counter = itertools.count(1)

def parse_csv_text(text: str):
    rows = []
    if not text:
        return rows

    # 1. Clean the text to handle the '$' symbol you saw in the frontend
    text = text.replace('$', '')

    sio = StringIO(text)
    # Using DictReader prevents the column-shift error (e.g., seeing 27.32 instead of 2.52)
    # by mapping data to header names directly
    reader = csv.DictReader(sio)

    for row in reader:
        try:
            # Clean keys and values to avoid whitespace issues
            clean_row = {k.strip().lower(): v.strip() for k, v in row.items()}

            symbol = clean_row.get("symbol", DEFAULT_SYMBOL)
            side = clean_row.get("side", "").upper()
            qty = float(clean_row.get("qty", 0))
            price = float(clean_row.get("price", 0))
            ts = clean_row.get("ts", "")

            if side in ("BUY", "SELL") and ts:
                rows.append({
                    "symbol": symbol or DEFAULT_SYMBOL,
                    "side": side,
                    "qty": qty,
                    "price": price,
                    "ts": ts
                })
        except (ValueError, KeyError, AttributeError):
            continue

    # 2. MANDATORY SORT: Fixes the 'Buy Date after Sell Date' error
    # This ensures the FIFO logic processes the earliest trades first
    rows.sort(key=lambda x: x['ts'])

    return rows

def fifo_match_with_lot_ids(transactions):
    # Grouping by symbol is necessary if your CSV contains multiple assets (WHWK, SOFI, etc.)
    # Otherwise, it might match a WHWK buy against a SOFI sell.
    symbol_queues = {}
    matches = []
    total_realized = 0.0

    for tx in transactions:
        sym = tx["symbol"]
        if sym not in symbol_queues:
            symbol_queues[sym] = []

        buy_queue = symbol_queues[sym]
        side = tx["side"]
        qty_to_process = tx["qty"]
        price = tx["price"]
        ts = tx["ts"]

        if side == "BUY":
            # Add to the queue for that specific symbol
            buy_queue.append({"lot_id": _next_lot_id(), "qty": qty_to_process, "price": price, "ts": ts})

        elif side == "SELL":
            while qty_to_process > 0 and buy_queue:
                buy_lot = buy_queue[0]
                match_qty = min(qty_to_process, buy_lot["qty"])

                # Logic: (Sell Price - Buy Price) * Qty
                realized = (price - buy_lot["price"]) * match_qty

                matches.append({
                    "symbol": sym,
                    "buy_lot_id": buy_lot["lot_id"],
                    "buy_ts": buy_lot["ts"],
                    "buy_price": buy_lot["price"], # The price you paid
                    "sell_ts": ts,
                    "sell_price": price,           # The price you sold at
                    "qty": match_qty,
                    "realized_pnl": round(realized, 2)
                })

                total_realized += realized
                buy_lot["qty"] -= match_qty
                qty_to_process -= match_qty

                if isclose(buy_lot["qty"], 0.0, abs_tol=1e-12):
                    buy_queue.pop(0)

    # Collect remaining lots across all symbols
    remaining = []
    for sym, queue in symbol_queues.items():
        for lot in queue:
            if lot["qty"] > 0:
                remaining.append({
                    "symbol": sym,
                    "lot_id": lot["lot_id"],
                    "qty": lot["qty"],
                    "price": lot["price"],
                    "ts": lot["ts"]
                })

    return {
        "matches": matches,
        "remaining_lots": remaining,
        "total_realized_pnl": round(total_realized, 10)
    }