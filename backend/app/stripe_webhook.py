# Minimal webhook handler example
from fastapi import Request, APIRouter, HTTPException
import stripe
from starlette.responses import JSONResponse
from fastapi import Depends
from dotenv import load_dotenv
import os

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

router = APIRouter()

@router.post("/stripe_webhook")
async def stripe_webhook(req: Request):
    payload = await req.body()
    sig = req.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig, endpoint_secret)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Handle events
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        # fulfill purchase, set user subscription in DB
        # add more event types as needed

    return JSONResponse({"received": True})# Minimal webhook handler example
from fastapi import Request, APIRouter, HTTPException
import stripe
from starlette.responses import JSONResponse
from fastapi import Depends
from dotenv import load_dotenv
import os

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

router = APIRouter()

@router.post("/stripe_webhook")
async def stripe_webhook(req: Request):
    payload = await req.body()
    sig = req.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig, endpoint_secret)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Handle events
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        # fulfill purchase, set user subscription in DB
        # add more event types as needed

    return JSONResponse({"received": True})