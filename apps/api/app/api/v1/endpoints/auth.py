from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.exceptions import ApiError
from app.core.security import create_access_token, hash_password, verify_password
from app.db.postgres import get_db_session
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserRead

router = APIRouter()


@router.get("/me", response_model=UserRead)
async def get_me(
    user: Annotated[User, Depends(get_current_user)],
) -> UserRead:
    return UserRead.model_validate(user)


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> UserRead:
    existing_user = await session.scalar(select(User).where(User.email == payload.email.lower()))
    if existing_user:
        raise ApiError(status_code=409, message="A user with this email already exists")

    bootstrap_email = get_settings().bootstrap_admin_email
    role = (
        "Admin"
        if bootstrap_email and payload.email.lower() == bootstrap_email.lower()
        else "User"
    )
    user = User(
        full_name=payload.full_name,
        email=payload.email.lower(),
        phone_number=payload.phone_number,
        role=role,
        password_hash=hash_password(payload.password),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return UserRead.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> TokenResponse:
    user = await session.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise ApiError(status_code=401, message="Invalid email or password")
    if not user.is_active:
        raise ApiError(status_code=403, message="This account has been deactivated")
    return TokenResponse(access_token=create_access_token(user.id))
