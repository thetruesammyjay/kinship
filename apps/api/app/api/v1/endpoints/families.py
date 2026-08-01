from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ApiError
from app.db.postgres import get_db_session
from app.models.person import Family
from app.schemas.family import FamilyCreate, FamilyRead

router = APIRouter()


@router.post("", response_model=FamilyRead, status_code=status.HTTP_201_CREATED)
async def create_family(
    payload: FamilyCreate,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> FamilyRead:
    family_record = Family(**payload.model_dump())
    session.add(family_record)
    await session.commit()
    await session.refresh(family_record)
    return FamilyRead.model_validate(family_record)


@router.get("/{family_id}", response_model=FamilyRead)
async def get_family(
    family_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> FamilyRead:
    family = await session.get(Family, str(family_id))
    if not family:
        raise ApiError(status_code=404, message="Family not found")
    return FamilyRead.model_validate(family)
