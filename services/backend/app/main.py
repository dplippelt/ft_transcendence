
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from fastapi import FastAPI

from app.api.v1 import auth, cards, chat, dungeons, leaderboard, lobbies, puzzles, scores, users, friends
from app.db.database import Base, engine
from app.core.settings import get_settings

# Import model modules so SQLAlchemy registers their tables in Base.metadata.
import app.models  # noqa: F401


settings = get_settings()
AVATAR_DIR = Path("uploads/avatars")
AVATAR_DIR.mkdir(parents=True, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="ft_transcendence API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,        prefix="/auth",         tags=["auth"])
app.include_router(users.router,       prefix="/users",        tags=["users"])
app.include_router(dungeons.router,    prefix="/dungeons",     tags=["dungeons"])
app.include_router(cards.router,       prefix="/cards",        tags=["cards"])
app.include_router(puzzles.router,     prefix="/puzzles",      tags=["puzzles"])
app.include_router(scores.router,      prefix="/scores",       tags=["scores"])
app.include_router(leaderboard.router, prefix="/leaderboard",  tags=["leaderboard"])
app.include_router(friends.router,     prefix="/friends",     tags=["friends"])
app.include_router(chat.router,        prefix="/chat",         tags=["chat"])
app.include_router(lobbies.router,     prefix="/lobbies",      tags=["lobbies"])

app.mount("/uploads/avatars", StaticFiles(directory=AVATAR_DIR), name="avatars")

@app.get("/")
def root():
    return {"message": "ft_transcendence API is running"}
