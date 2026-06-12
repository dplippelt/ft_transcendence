from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def get_puzzles():
    return {"message": "puzzles list"}
