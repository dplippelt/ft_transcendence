from typing import Annotated
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from api import auth, users
from models.user import User

from db.database import Base, get_db, engine
from models.dungeon import Dungeon

app = FastAPI(title="Dungeon Card Game API")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.on_event("startup")
def on_startup():
  Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
# app.include_router(dungeon.router, prefix="/api/dungeons", tags=["dungeons"])

@app.get("/health")
def health_check():
  return {"status": "ok"}

