from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def get_dungeons():
    return {"message": "dungeons list"}
