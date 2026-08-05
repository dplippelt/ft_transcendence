from pydantic import BaseModel


class DungeonResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    difficulty: int

    model_config = {
        "from_attributes": True
    }
