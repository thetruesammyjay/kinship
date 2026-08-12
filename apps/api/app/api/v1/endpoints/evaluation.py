from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db_session
from app.dependencies import get_current_user, get_evaluation_service
from app.models.user import User
from app.services.evaluation_service import EvaluationService

router = APIRouter()


@router.get("/accuracy")
async def get_accuracy(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    service: Annotated[EvaluationService, Depends(get_evaluation_service)],
) -> dict[str, float | int]:
    return await service.accuracy_summary(session)


@router.get("/performance")
async def get_performance(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    service: Annotated[EvaluationService, Depends(get_evaluation_service)],
) -> dict[str, float | int]:
    return await service.performance_summary(session)


@router.post("/sus")
async def submit_sus_response(
    _: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    return {"status": "accepted"}


@router.get("/sus/summary")
async def get_sus_summary(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    service: Annotated[EvaluationService, Depends(get_evaluation_service)],
) -> dict[str, float | int | str]:
    return await service.sus_summary(session)
