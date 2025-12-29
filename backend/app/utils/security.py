# app/utils/security.py
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
MAX_BCRYPT_BYTES = 72

def _truncate_to_bcrypt_limit(password: str) -> str:
    """
    Truncate password so UTF-8 encoded length <= 72 bytes
    """
    encoded = password.encode("utf-8")
    if len(encoded) <= MAX_BCRYPT_BYTES:
        return password
    truncated = encoded[:MAX_BCRYPT_BYTES]
    return truncated.decode("utf-8", errors="ignore")

def get_password_hash(password: str) -> str:
    safe_password = _truncate_to_bcrypt_limit(password)
    return pwd_context.hash(safe_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    safe_password = _truncate_to_bcrypt_limit(plain_password)
    return pwd_context.verify(safe_password, hashed_password)
