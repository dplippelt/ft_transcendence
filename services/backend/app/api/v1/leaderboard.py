from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def get_leaderboard():
    return {"message": "leaderboard"}
