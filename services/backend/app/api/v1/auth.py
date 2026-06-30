from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse, Token
from app.core.security import (verify_password, get_password_hash, create_access_token, DUMMY_PASSWORD_HASH)


router = APIRouter()


@router.post("/register", response_model=UserResponse)
def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    existing_user = (
        db.query(User)
        .filter(User.username == user_data.username)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )

    if user_data.email:
        existing_email = (
            db.query(User)
            .filter(User.email == user_data.email)
            .first()
        )

        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )

    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        is_guest=False,
    )

    db.add(user)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists",
        )

    db.refresh(user)

    return user


@router.post("/login", response_model=Token)
def login_user(user_data: UserLogin, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(User.username == user_data.username)
        .first()
    )

    password_hash = user.password_hash if user else DUMMY_PASSWORD_HASH
    is_valid_password = verify_password(user_data.password, password_hash)

    if not user or not is_valid_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    access_token = create_access_token(data={"sub": user.username})

    return Token(
        access_token=access_token,
        token_type="bearer",
    )
