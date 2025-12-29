import math
import itertools
from app import fifo_engine as fe


def reset_lot_counter():
    fe.reset_lot_counter()




# -------------------------
# parse_csv_text tests
# -------------------------


def test_parse_csv_text_with_header_and_symbol():
    text = (
    "symbol,side,qty,price,ts\n"
    "AAPL,BUY,100,150.00,2025-01-02T09:30:00\n"
    "AAPL,SELL,50,155.00,2025-01-10T11:00:00\n"
    )
    rows = fe.parse_csv_text(text)
    assert isinstance(rows, list)
    assert len(rows) == 2
    assert rows[0]["symbol"] == "AAPL"
    assert rows[0]["side"] == "BUY"
    assert rows[0]["qty"] == 100
    assert math.isclose(rows[0]["price"], 150.0, rel_tol=0, abs_tol=1e-12)
    assert rows[1]["side"] == "SELL"




def test_parse_csv_text_without_symbol_column_and_no_header():
    text = (
    "BUY,10,1.5,2025-01-01T00:00:00\n"
    "SELL,5,2.0,2025-01-02T00:00:00\n"
    "\n"
    )
    rows = fe.parse_csv_text(text)
    assert len(rows) == 2
    assert rows[0]["symbol"] == fe.DEFAULT_SYMBOL
    assert rows[0]["side"] == "BUY"
    assert rows[1]["side"] == "SELL"
    assert rows[0]["qty"] == 10
    assert math.isclose(rows[1]["price"], 2.0, rel_tol=0, abs_tol=1e-12)



def test_parse_csv_text_ignores_malformed_rows():
    text = (
    "symbol,side,qty,price,ts\n"
    "AAPL,BUY,not_int,150.00,2025-01-02T09:30:00\n"
    "BADLINE\n"
    "AAPL,SELL,10,abc,2025-01-10T11:00:00\n"
    "AAPL,SELL,5,155.00,2025-01-10T11:00:00\n"
    )
    rows = fe.parse_csv_text(text)
    assert len(rows) == 1
    assert rows[0]["side"] == "SELL"
    assert rows[0]["qty"] == 5




# -------------------------
# fifo_match_with_lot_ids tests
# -------------------------


def test_fifo_simple_buy_then_sell_matches_and_pnl():
    reset_lot_counter()
    txs = [
    {"symbol": "X", "side": "BUY", "qty": 100, "price": 10.0, "ts": "2025-01-01T09:30:00"},
    {"symbol": "X", "side": "SELL", "qty": 40, "price": 12.0, "ts": "2025-01-02T10:00:00"},
    ]
    res = fe.fifo_match_with_lot_ids(txs)
    assert len(res["matches"]) == 1
    assert res["matches"][0]["qty"] == 40
    assert math.isclose(res["total_realized_pnl"], 80.0, rel_tol=0, abs_tol=1e-9)
    assert len(res["remaining_lots"]) == 1
    assert res["remaining_lots"][0]["qty"] == 60




def test_fifo_multiple_buys_then_sell_consumes_in_fifo_order():
    reset_lot_counter()
    txs = [
    {"symbol": "X", "side": "BUY", "qty": 50, "price": 5.0, "ts": "2025-01-01T09:30:00"},
    {"symbol": "X", "side": "BUY", "qty": 100, "price": 6.0, "ts": "2025-01-01T09:31:00"},
    {"symbol": "X", "side": "SELL", "qty": 120, "price": 7.0, "ts": "2025-01-02T10:00:00"},
    ]
    res = fe.fifo_match_with_lot_ids(txs)
    assert len(res["matches"]) == 2
    assert res["matches"][0]["qty"] == 50
    assert res["matches"][1]["qty"] == 70
    assert math.isclose(res["total_realized_pnl"], 170.0, rel_tol=0, abs_tol=1e-9)
    assert len(res["remaining_lots"]) == 1
    assert res["remaining_lots"][0]["qty"] == 30




def test_fifo_supports_short_then_cover_and_realized_pnl_negative_and_positive():
    reset_lot_counter()
    txs = [
    {"symbol": "Y", "side": "SELL", "qty": 100, "price": 20.0, "ts": "2025-01-01T09:30:00"},
    {"symbol": "Y", "side": "BUY", "qty": 40, "price": 22.0, "ts": "2025-01-02T10:00:00"},
    {"symbol": "Y", "side": "BUY", "qty": 60, "price": 18.0, "ts": "2025-01-03T11:00:00"},
    ]
    res = fe.fifo_match_with_lot_ids(txs)
    assert len(res["remaining_lots"]) == 0
    assert math.isclose(res["total_realized_pnl"], 40.0, rel_tol=0, abs_tol=1e-9)
    assert all("buy_lot_id" in m and m["buy_lot_id"].startswith("L") for m in res["matches"])




def test_fifo_returns_stable_lot_ids_when_counter_reset_between_runs():
    reset_lot_counter()
    txs1 = [{"symbol": "Z", "side": "BUY", "qty": 10, "price": 1.0, "ts": "2025-01-01T09:00:00"}]
    r1 = fe.fifo_match_with_lot_ids(txs1)
    assert r1["remaining_lots"][0]["lot_id"] == "L1"


    reset_lot_counter()
    txs2 = [
    {"symbol": "Z", "side": "BUY", "qty": 10, "price": 1.0, "ts": "2025-01-01T09:00:00"},
    {"symbol": "Z", "side": "BUY", "qty": 5, "price": 2.0, "ts": "2025-01-01T09:01:00"},
    ]
    r2 = fe.fifo_match_with_lot_ids(txs2)
    ids = [l["lot_id"] for l in r2["remaining_lots"]]
    assert ids == ["L1", "L2"]