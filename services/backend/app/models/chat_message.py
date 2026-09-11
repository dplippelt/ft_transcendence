from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    __table_args__ = (
        # Every query against this table filters by sender_id *and*
        # receiver_id together (get_conversation's OR of the two directions,
        # ordered by created_at; mark_conversation_as_read's exact pair) --
        # never by just one of them alone. This one composite covers both,
        # including get_conversation's ORDER BY created_at within each
        # direction, so the separate single-column sender_id index below is
        # redundant (this composite's leading column already serves plain
        # sender_id lookups, same reasoning as LobbyMessage's index).
        Index("ix_chat_messages_sender_id_receiver_id_created_at", "sender_id", "receiver_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    sender_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    receiver_id: Mapped[int] = mapped_column(
        # Keeps its own index even though no query filters on receiver_id
        # alone: it's still needed so a User delete's ON DELETE CASCADE has
        # an index to find matching rows by -- the composite above doesn't
        # cover that, since receiver_id isn't its leading column.
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

    read_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    sender: Mapped["User"] = relationship(
        back_populates="sent_messages",
        foreign_keys=[sender_id],
    )

    receiver: Mapped["User"] = relationship(
        back_populates="received_messages",
        foreign_keys=[receiver_id],
    )
