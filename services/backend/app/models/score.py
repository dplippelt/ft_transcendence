from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Score(Base):
    __tablename__ = "scores"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    dungeon_id: Mapped[int] = mapped_column(
        ForeignKey("dungeons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    value: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    user: Mapped["User"] = relationship(
        back_populates="scores",
    )

    dungeon: Mapped["Dungeon"] = relationship(
        back_populates="scores",
    )
