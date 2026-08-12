from sqlalchemy.orm import Session

from app.models.dungeon import Dungeon


def list_dungeons(db: Session) -> list[Dungeon]:
    return (
        db.query(Dungeon)
        .order_by(Dungeon.id)
        .all()
    )


def get_dungeon_by_id(db: Session, dungeon_id: int) -> Dungeon | None:
    return (
        db.query(Dungeon)
        .filter(Dungeon.id == dungeon_id)
        .first()
    )
