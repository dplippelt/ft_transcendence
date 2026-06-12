from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def get_scores():
    return {"message": "scores list"}
