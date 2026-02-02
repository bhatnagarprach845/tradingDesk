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
    sio = StringIO(text)
    reader = csv.reader(sio)
    lines = [r for r in reader if r and any(c.strip() for c in r)]
    if not lines:
        return rows

    first = [c.strip().lower() for c in lines[0]]
    header_mode = False
    header_map = {}
    start = 0

    if "side" in first and "qty" in first and "price" in first and "ts" in first:
        header_mode = True
        start = 1
        for idx, name in enumerate(first):
            header_map[name] = idx

    for r in lines[start:]:
        row = [c.strip() for c in r] + [""] * (5 - len(r))
        if header_mode:
            symbol = row[header_map["symbol"]] if "symbol" in header_map else DEFAULT_SYMBOL
            side = row[header_map["side"]]
            qty_raw = row[header_map["qty"]]
            price_raw = row[header_map["price"]]
            ts = row[header_map["ts"]]
        else:
            if len(r) >= 5:
                symbol = row[0] if row[0] else DEFAULT_SYMBOL
                side = row[1] if len(row) > 1 else ""
                qty_raw = row[2] if len(row) > 2 else ""
                price_raw = row[3] if len(row) > 3 else ""
                ts = row[4] if len(row) > 4 else ""
            else:
                symbol = DEFAULT_SYMBOL
                side = row[0] if len(row) > 0 else ""
                qty_raw = row[1] if len(row) > 1 else ""
                price_raw = row[2] if len(row) > 2 else ""
                ts = row[3] if len(row) > 3 else ""

        try:
            side_u = side.strip().upper()
            qty = int(qty_raw)
            price = float(price_raw)
            ts = ts.strip()

            if not side_u or side_u not in ("BUY", "SELL") or not ts:
                continue

            rows.append({"symbol": symbol.strip() if symbol else DEFAULT_SYMBOL,
                         "side": side_u, "qty": qty, "price": price, "ts": ts})
        except Exception:
            continue

    return rows

def fifo_match_with_lot_ids(transactions):
    buy_queue = []
    matches = []
    total_realized = 0.0

    def enqueue(qty, price, ts):
        if qty == 0:
            return
        lot = {"lot_id": _next_lot_id(), "qty": qty, "price": price, "ts": ts}
        buy_queue.append(lot)
        return lot

    for tx in transactions:
        side = tx["side"].upper()
        qty_to_process = int(tx["qty"])
        price = float(tx["price"])
        ts = tx["ts"]
        sym = tx.get("symbol", DEFAULT_SYMBOL)

        if side == "BUY":
            while qty_to_process > 0 and buy_queue and buy_queue[0]["qty"] < 0:
                short_lot = buy_queue[0]
                match_qty = min(qty_to_process, -short_lot["qty"])
                realized = (short_lot["price"] - price) * match_qty

                matches.append({
                    "symbol": sym,
                    "buy_lot_id": short_lot["lot_id"],
                    "buy_ts": short_lot["ts"],
                    "buy_price": short_lot["price"],
                    "sell_ts": ts,
                    "sell_price": price,
                    "qty": match_qty,
                    "realized_pnl": round(realized, 10)
                })
                total_realized += realized
                short_lot["qty"] += match_qty
                qty_to_process -= match_qty

                if isclose(short_lot["qty"], 0.0, abs_tol=1e-12):
                    buy_queue.pop(0)

            if qty_to_process > 0:
                enqueue(qty_to_process, price, ts)

        elif side == "SELL":
            while qty_to_process > 0 and buy_queue and buy_queue[0]["qty"] > 0:
                buy_lot = buy_queue[0]
                match_qty = min(qty_to_process, buy_lot["qty"])
                realized = (price - buy_lot["price"]) * match_qty

                matches.append({
                    "symbol": sym,
                    "buy_lot_id": buy_lot["lot_id"],
                    "buy_ts": buy_lot["ts"],
                    "buy_price": buy_lot["price"],
                    "sell_ts": ts,
                    "sell_price": price,
                    "qty": match_qty,
                    "realized_pnl": round(realized, 10)
                })
                total_realized += realized
                buy_lot["qty"] -= match_qty
                qty_to_process -= match_qty

                if isclose(buy_lot["qty"], 0.0, abs_tol=1e-12):
                    buy_queue.pop(0)

            if qty_to_process > 0:
                enqueue(-qty_to_process, price, ts)
            qty_to_process = 0
        else:
            pass

    remaining = [{"symbol": transactions[0].get("symbol", DEFAULT_SYMBOL),
                  "lot_id": l["lot_id"], "qty": l["qty"], "price": l["price"],
                  "ts": l["ts"]} for l in buy_queue]

    return {"matches": matches, "remaining_lots": remaining,
            "total_realized_pnl": round(total_realized, 10)}



