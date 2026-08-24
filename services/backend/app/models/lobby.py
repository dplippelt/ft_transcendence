from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Lobby(Base):
    __tablename__ = "lobbies"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(50),
        index=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    members: Mapped[list["LobbyMember"]] = relationship(
        back_populates="lobby",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    messages: Mapped[list["LobbyMessage"]] = relationship(
        back_populates="lobby",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        # Lookups treat lobby names as case-insensitive, so uniqueness has
        # to be enforced on lower(name) too, not just the raw column.
        Index("uq_lobbies_name_lower", func.lower(name), unique=True),
    )
