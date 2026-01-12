# backend/app/api/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta, timezone
import jwt
import os
from fastapi.security import OAuth2PasswordBearer

from app.models import User  # This is the DynamoDB User class
from app.utils.security import get_password_hash, verify_password
from app.schemas import UserCreate, UserOut, Token

SECRET_KEY = os.getenv("JWT_SECRET", "supersecret")
ALGORITHM = "HS256"

router = APIRouter(prefix="/auth", tags=["Auth"])

# OAuth2 for protected routes
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


@router.post("/signup", response_model=UserOut)
def signup(user: UserCreate):
    # 1. Check if user already exists in DynamoDB
    if User.get_by_email(user.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Hash password and save to DynamoDB
    hashed = get_password_hash(user.password)
    try:
        new_user = User.create(email=user.email, hashed_password=hashed)
        # DynamoDB uses strings for IDs; we use email as the unique identifier
        return {"id": 0, "email": new_user['email']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/token", response_model=Token)
def login(user: UserCreate):
    print(f"!!! LOGIN ATTEMPT: {user.email} !!!")

    # 1. Fetch user from DynamoDB
    db_user = User.get_by_email(user.email)

    # 2. Verify existence and password
    if not db_user or not verify_password(user.password, db_user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # 3. Generate JWT
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    payload = {"sub": db_user['email'], "exp": expire}
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return {"access_token": token, "token_type": "bearer"}


def get_current_user(token: str = Depends(oauth2_scheme)):
    """Dependency to get the current authenticated user from DynamoDB."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = User.get_by_email(email)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")