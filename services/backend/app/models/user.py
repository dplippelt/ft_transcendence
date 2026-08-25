from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    username: Mapped[str | None] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=True,
    )

    display_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    avatar_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    is_guest: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    auth_accounts: Mapped[list["AuthAccount"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    two_factor_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    two_factor_secret: Mapped[str | None] = mapped_column(
        String(64), # 64 characters for a base32-encoded secret
        nullable=True,
    )

    # This doesnt create a database column. It calculates the list from the exisiting auth_accounts rows
    @property
    def linked_providers(self) -> list[str]:
        return sorted({
            account.provider
            for account in self.auth_accounts
        })

    sent_friend_requests: Mapped[list["FriendRequest"]] = relationship(
        back_populates="requester",
        foreign_keys="FriendRequest.requester_id",
        passive_deletes=True,
    )

    received_friend_requests: Mapped[list["FriendRequest"]] = relationship(
        back_populates="recipient",
        foreign_keys="FriendRequest.recipient_id",
        passive_deletes=True,
    )

    friendships_a: Mapped[list["Friendship"]] = relationship(
        back_populates="user_a",
        foreign_keys="Friendship.user_a_id",
        passive_deletes=True,
    )

    friendships_b: Mapped[list["Friendship"]] = relationship(
        back_populates="user_b",
        foreign_keys="Friendship.user_b_id",
        passive_deletes=True,
    )

    # Not delete-orphan: a ChatMessage has two independent parents (sender
    # and receiver), and delete-orphan on both sides means removing a
    # message from *either* collection deletes the row outright, even
    # though the other side still references it. Actual cleanup on user
    # deletion is left to the FK's ondelete="CASCADE" instead.
    sent_messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="sender",
        foreign_keys="ChatMessage.sender_id",
        passive_deletes=True,
    )

    received_messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="receiver",
        foreign_keys="ChatMessage.receiver_id",
        passive_deletes=True,
    )

    scores: Mapped[list["Score"]] = relationship(
        back_populates="user",
        passive_deletes=True,
    )

    lobby_memberships: Mapped[list["LobbyMember"]] = relationship(
        back_populates="user",
        passive_deletes=True,
    )
