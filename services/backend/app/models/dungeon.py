from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column 
from db.database import Base

class Dungeon(Base):
  __tablename__ = "dungeons"

  id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
  name: Mapped[str] = mapped_column(String(100), nullable=False)
  difficulty: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
  description: Mapped[str | None] = mapped_column(String(255), nullable=True)
