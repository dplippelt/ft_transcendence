from fastapi import FastAPI

from app.api.v1 import users, dungeons, cards, puzzles, scores, leaderboard

app = FastAPI(title="ft_transcendence API", version="1.0.0")

app.include_router(users.router,       prefix="/users",       tags=["users"])
app.include_router(dungeons.router,    prefix="/dungeons",    tags=["dungeons"])
app.include_router(cards.router,       prefix="/cards",       tags=["cards"])
app.include_router(puzzles.router,     prefix="/puzzles",     tags=["puzzles"])
app.include_router(scores.router,      prefix="/scores",      tags=["scores"])
app.include_router(leaderboard.router, prefix="/leaderboard", tags=["leaderboard"])


@app.get("/")
def root():
    return {"message": "ft_transcendence API is running"}
