from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.lobby import Lobby
    from app.models.user import User


class LobbyMessage(Base):
    __tablename__ = "lobby_messages"
    __table_args__ = (
        # Covers get_lobby_messages' filter+sort (lobby_id, then order by
        # created_at); the leading column also serves plain lobby_id
        # lookups, so no separate single-column index is needed for it.
        Index("ix_lobby_messages_lobby_id_created_at", "lobby_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    lobby_id: Mapped[int] = mapped_column(
        ForeignKey("lobbies.id", ondelete="CASCADE"),
        nullable=False,
    )

    sender_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    content: Mapped[str] = mapped_column(
        String(2000),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    lobby: Mapped["Lobby"] = relationship(
        back_populates="messages",
    )

    sender: Mapped["User"] = relationship()
