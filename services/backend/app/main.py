from fastapi import FastAPI

from app.db.database import Base, engine
from app.models.user import User
from app.api.v1 import auth, users, dungeons, cards, puzzles, scores, leaderboard

app = FastAPI(title="ft_transcendence API", version="1.0.0")

@app.on_event("startup")
def on_startup():
  Base.metadata.create_all(bind=engine)

app.include_router(auth.router,        prefix="/auth",         tags=["auth"])
app.include_router(users.router,       prefix="/users",        tags=["users"])
app.include_router(dungeons.router,    prefix="/dungeons",     tags=["dungeons"])
app.include_router(cards.router,       prefix="/cards",        tags=["cards"])
app.include_router(puzzles.router,     prefix="/puzzles",      tags=["puzzles"])
app.include_router(scores.router,      prefix="/scores",       tags=["scores"])
app.include_router(leaderboard.router, prefix="/leaderboard",  tags=["leaderboard"])

@app.get("/")
def root():
    return {"message": "ft_transcendence API is running"}
