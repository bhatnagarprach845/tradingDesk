# backend/app/api/auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import jwt
import os
from fastapi.security import OAuth2PasswordRequestForm # Add this import

from app.db import SessionLocal
from app.models import User
from app.utils.security import get_password_hash, verify_password
from app.schemas import UserCreate, UserOut, Token

SECRET_KEY = os.getenv("JWT_SECRET", "supersecret")
ALGORITHM = "HS256"

router = APIRouter(prefix="/auth", tags=["Auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/signup", response_model=UserOut)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(user.password.encode("utf-8")) > 128:
        raise HTTPException(status_code=400, detail="Password too long")
    hashed = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "email": new_user.email}

@router.post("/token", response_model=Token)
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    payload = {"sub": str(db_user.id), "exp": datetime.utcnow() + timedelta(hours=24)}
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}

# @router.post("/token", response_model=Token)
# def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
#     # Use form_data.username instead of user.email
#     db_user = db.query(User).filter(User.email == form_data.username).first()
#     if not db_user or not verify_password(form_data.password, db_user.hashed_password):
#         raise HTTPException(status_code=401, detail="Invalid credentials")
#
#     payload = {"sub": str(db_user.id), "exp": datetime.utcnow() + timedelta(hours=24)}
#     token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
#     return {"access_token": token, "token_type": "bearer"}

# OAuth2 for protected routes
# from fastapi.security import OAuth2PasswordBearer
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        user = db.query(User).get(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
