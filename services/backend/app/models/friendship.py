from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Friendship(Base):
    __tablename__ = "friendships"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_a_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_b_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_a: Mapped["User"] = relationship(
        back_populates="friendships_a",
        foreign_keys=[user_a_id],
    )

    user_b: Mapped["User"] = relationship(
        back_populates="friendships_b",
        foreign_keys=[user_b_id],
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "user_a_id",
            "user_b_id",
            name="uq_friendship_pair",
        ),
        CheckConstraint(
            "user_a_id < user_b_id",
            name="ck_friendship_order",
        ),
    )
