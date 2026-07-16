from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

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
