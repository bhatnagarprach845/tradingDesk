from sqlalchemy.orm import Session
from app import models
from app.utils.security import get_password_hash, verify_password




def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()




def create_user(db: Session, email: str, password: str):
    hashed = get_password_hash(password)
    user = models.User(email=email, password_hash=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user




def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user




def update_user_stripe_ids(db: Session, user: models.User, customer_id: str = None, subscription_id: str = None, subscription_item_id: str = None):
    if customer_id:
        user.stripe_customer_id = customer_id
    if subscription_id:
        user.stripe_subscription_id = subscription_id
    if subscription_item_id:
        user.stripe_subscription_item_id = subscription_item_id
    db.add(user)
    db.commit()
    db.refresh(user)
    return user