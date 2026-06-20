import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv(
  "DATABASE_URL",
  "postgresql+psycopg://game_user:game_password@db:5432/game_db"
)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
  autocommit=False,
  autoflush=False,
  bind=engine
)

class Base(DeclarativeBase):
  pass

def get_db():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()

# URL → engine → session factory → Base → get_db
