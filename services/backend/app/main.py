from fastapi import FastAPI
from typing import Annotated

from app.api.v1 import users, dungeons, cards, puzzles, scores, leaderboard

from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from api import auth, users
from models.user import User

from db.database import Base, get_db, engine
from models.dungeon import Dungeon

app = FastAPI(title="ft_transcendence API", version="1.0.0")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.on_event("startup")
def on_startup():
  Base.metadata.create_all(bind=engine)

app.include_router(users.router,       prefix="/users",       tags=["users"])
app.include_router(dungeons.router,    prefix="/dungeons",    tags=["dungeons"])
app.include_router(cards.router,       prefix="/cards",       tags=["cards"])
app.include_router(puzzles.router,     prefix="/puzzles",     tags=["puzzles"])
app.include_router(scores.router,      prefix="/scores",      tags=["scores"])
app.include_router(leaderboard.router, prefix="/leaderboard", tags=["leaderboard"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])

@app.get("/")
def root():
    return {"message": "ft_transcendence API is running"}
