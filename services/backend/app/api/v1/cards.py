from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def get_cards():
    return {"message": "cards list"}
