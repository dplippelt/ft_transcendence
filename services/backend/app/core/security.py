from datetime import datetime, timedelta, timezone

import os
import jwt
from pwdlib import PasswordHash
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

password_hash = PasswordHash.recommended()

DUMMTY_PASSWORD_HASH = password_hash.hash("")

def verify_password(plain_password: str, hashed_password: str) -> bool:
  return password_hash.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
  return password_hash.hash(password)

def create_access_token(data: dict,  expires_delta: timedelta | None = None) -> str:
  to_encode = data.copy()
  if expires_delta:
   expire = datetime.now(timezone.utc) + expires_delta
  else:
   expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
  to_encode.update({"exp": expire})
  encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
  return encoded_jwt

def decode_access_token(token: str) -> dict | None:
  try:
   payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
   return payload
  except (ExpiredSignatureError, InvalidTokenError):
   return None
