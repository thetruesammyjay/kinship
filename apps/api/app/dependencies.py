from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.core.exceptions import ApiError
from app.core.security import decode_access_token
from app.db.postgres import get_db_session
from app.models.user import User
from app.services.evaluation_service import EvaluationService, evaluation_service
from app.services.kinship_engine import KinshipEngine
from app.services.person_service import PersonService, person_service

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise ApiError(status_code=401, message="Authentication required")
    try:
        user_id = decode_access_token(credentials.credentials)
    except ValueError as exc:
        raise ApiError(status_code=401, message=str(exc)) from exc

    user = await session.get(User, user_id)
    if user is None or not user.is_active:
        raise ApiError(status_code=401, message="User account is unavailable")
    return user


def require_roles(*roles: str):
    async def role_dependency(
        user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if user.role not in roles:
            raise ApiError(status_code=403, message="Insufficient permissions")
        return user

    return role_dependency


def get_app_settings() -> Settings:
    return get_settings()


def get_person_service() -> PersonService:
    return person_service


def get_kinship_engine() -> KinshipEngine:
    return KinshipEngine(
        person_service=person_service,
        relatedness_threshold_degree=get_settings().relatedness_threshold_degree,
    )


def get_evaluation_service() -> EvaluationService:
    return evaluation_service
