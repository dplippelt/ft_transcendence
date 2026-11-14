from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class LobbyInvitation(Base):
    __tablename__ = "lobby_invitations"

    # An unpredictable identifier shared only with the invited user's socket.
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    lobby_id: Mapped[int] = mapped_column(
        ForeignKey("lobbies.id", ondelete="CASCADE"), index=True, nullable=False
    )
    inviter_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    recipient_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
