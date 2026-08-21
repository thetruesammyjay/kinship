from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ApiError
from app.db.postgres import get_db_session
from app.dependencies import require_roles
from app.models.person import Clan, Family
from app.models.user import User
from app.schemas.family import FamilyCreate, FamilyRead, FamilyUpdate
from app.services.audit_service import record_audit

router = APIRouter()


@router.get("", response_model=list[FamilyRead])
async def list_families(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[FamilyRead]:
    families = await session.scalars(select(Family).order_by(Family.family_name))
    return [FamilyRead.model_validate(family) for family in families.all()]


@router.post("", response_model=FamilyRead, status_code=status.HTTP_201_CREATED)
async def create_family(
    payload: FamilyCreate,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    current_user: Annotated[User, Depends(require_roles("Admin", "Registrar"))],
) -> FamilyRead:
    data = payload.model_dump()
    if data["clan_id"] is not None:
        data["clan_id"] = str(data["clan_id"])
    if data["clan_id"] is not None and await session.get(Clan, data["clan_id"]) is None:
        raise ApiError(status_code=404, message="Clan not found")
    family_record = Family(**data)
    session.add(family_record)
    await session.flush()
    record_audit(
        session,
        actor_user_id=current_user.id,
        action="family.created",
        entity_type="family",
        entity_id=family_record.id,
        details={key: str(value) if value is not None else None for key, value in data.items()},
    )
    await session.commit()
    await session.refresh(family_record)
    return FamilyRead.model_validate(family_record)


@router.patch("/{family_id}", response_model=FamilyRead)
async def update_family(
    family_id: UUID,
    payload: FamilyUpdate,
    current_user: Annotated[User, Depends(require_roles("Admin", "Registrar"))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> FamilyRead:
    family = await session.get(Family, str(family_id))
    if family is None:
        raise ApiError(status_code=404, message="Family not found")
    changes = payload.model_dump(exclude_unset=True)
    if "clan_id" in changes:
        changes["clan_id"] = str(changes["clan_id"]) if changes["clan_id"] else None
        if changes["clan_id"] and await session.get(Clan, changes["clan_id"]) is None:
            raise ApiError(status_code=404, message="Clan not found")
    for field, value in changes.items():
        setattr(family, field, value)
    record_audit(
        session,
        actor_user_id=current_user.id,
        action="family.updated",
        entity_type="family",
        entity_id=family.id,
        details=changes,
    )
    await session.commit()
    await session.refresh(family)
    return FamilyRead.model_validate(family)


@router.get("/{family_id}", response_model=FamilyRead)
async def get_family(
    family_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> FamilyRead:
    family = await session.get(Family, str(family_id))
    if not family:
        raise ApiError(status_code=404, message="Family not found")
    return FamilyRead.model_validate(family)
