import os
import stripe
import time
from dotenv import load_dotenv
from typing import Tuple, Optional
from stripe.error import StripeError, InvalidRequestError, AuthenticationError

# Load environment variables
load_dotenv()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
PRICE_METERED_ID = os.getenv("STRIPE_PRICE_METERED_ID")


def create_or_get_customer(email: str, name: Optional[str] = None) -> dict:
    """
    Create a new Stripe customer. In production, you may want to
    check if the customer already exists using metadata or external ID.
    """
    try:
        cust = stripe.Customer.create(email=email, name=name)
        return cust
    except StripeError as e:
        raise RuntimeError(f"Stripe error while creating customer: {e.user_message or str(e)}")
    except Exception as e:
        raise RuntimeError(f"Unexpected error while creating customer: {str(e)}")


def create_metered_subscription(customer_id: str, price_id: Optional[str] = None) -> Tuple[dict, str]:
    """
    Create a metered subscription for a given customer and price ID.
    Returns the subscription object and subscription item ID.
    """
    price_id = price_id or PRICE_METERED_ID
    if not price_id:
        raise ValueError("Metered price ID not configured")

    try:
        sub = stripe.Subscription.create(
            customer=customer_id,
            items=[{"price": price_id}],
            expand=["latest_invoice.payment_intent", "items.data.price"],
        )
        item = sub["items"]["data"][0]
        return sub, item["id"]
    except StripeError as e:
        raise RuntimeError(f"Stripe error while creating subscription: {e.user_message or str(e)}")
    except Exception as e:
        raise RuntimeError(f"Unexpected error while creating subscription: {str(e)}")


def report_usage(subscription_item_id: str, quantity: int, timestamp: Optional[int] = None):
    """
    Report usage for a metered subscription item.
    """
    if quantity <= 0:
        return None

    timestamp = timestamp or int(time.time())

    try:
        rec = stripe.UsageRecord.create(
            quantity=int(quantity),
            timestamp=int(timestamp),
            subscription_item=subscription_item_id,
            action="increment",
        )
        return rec
    except StripeError as e:
        raise RuntimeError(f"Stripe error while reporting usage: {e.user_message or str(e)}")
    except Exception as e:
        raise RuntimeError(f"Unexpected error while reporting usage: {str(e)}")