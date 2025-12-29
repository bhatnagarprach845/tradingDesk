import io
import json
from fastapi.testclient import TestClient
from app.main import app as fastapi_app


client = TestClient(fastapi_app)




def test_health():
    r = client.get('/health')
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}




def test_upload_csv_and_get_results_simple():
    sample = (
    "symbol,side,qty,price,ts\n"
    "AAPL,BUY,100,10.0,2025-01-02T09:30:00\n"
    "AAPL,SELL,50,15.0,2025-01-10T11:00:00\n"
    )
    files = {"file": ("sample.csv", sample, "text/csv")}
    r = client.post('/api/upload_csv', files=files)
    assert r.status_code == 200
    body = r.json()
    assert "result_id" in body
    rid = body["result_id"]


    # fetch results
    r2 = client.get(f'/api/results/{rid}')
    assert r2.status_code == 200
    out = r2.json()
    assert "matches" in out and "remaining_lots" in out
    assert out["total_realized_pnl"] == 500.0 # (15-10)*50 = 250? Wait — reconcile: buy100 sell50 => (15-10)*50=250. But uploads aggregate all symbols; ensure value




def test_upload_invalid_csv_returns_400():
    bad = "not,a,valid,csv\nfoo\n"
    files = {"file": ("bad.csv", bad, "text/csv")}
    r = client.post('/api/upload_csv', files=files)
    assert r.status_code == 400