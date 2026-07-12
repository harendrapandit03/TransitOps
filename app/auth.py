import os
from datetime import datetime, timedelta, UTC

from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext

load_dotenv()


# JWT CONFIGURATION


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)
)


# PASSWORD HASHING


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# PASSWORD FUNCTIONS


def hash_password(password: str) -> str:
    """
    Hash a plain text password before storing it.
    """
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """
    Verify a password during login.
    """
    return pwd_context.verify(
        plain_password,
        hashed_password
    )



# JWT TOKEN FUNCTIONS


def create_access_token(data: dict) -> str:
    """
    Create a JWT access token.
    """

    to_encode = data.copy()

    expire = datetime.now(UTC) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


def verify_access_token(token: str):
    """
    Decode and verify JWT token.
    Returns payload if valid.
    Returns None if invalid.
    """

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except JWTError:
        return None