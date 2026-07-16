from typing import Annotated

from fastapi import Depends
from services.backend.app.api.v1.users import get_current_user
from sqlalchemy.orm import Session

from app.db.database import get_db


DbSession = Annotated[Session, Depends(get_db)]

CurrentUser = Annotated[User, Depends(get_current_user)]
