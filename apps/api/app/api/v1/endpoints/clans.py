from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ApiError
from app.db.postgres import get_db_session
from app.dependencies import require_roles
from app.models.person import Clan
from app.models.user import User
from app.schemas.clan import ClanCreate, ClanRead, ClanUpdate
from app.services.audit_service import record_audit

router = APIRouter()


@router.get("", response_model=list[ClanRead])
async def list_clans(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[ClanRead]:
    clans = await session.scalars(select(Clan).order_by(Clan.region, Clan.clan_name))
    return [ClanRead.model_validate(clan) for clan in clans.all()]


@router.post("", response_model=ClanRead, status_code=status.HTTP_201_CREATED)
async def create_clan(
    payload: ClanCreate,
    current_user: Annotated[User, Depends(require_roles("Admin", "Registrar"))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ClanRead:
    if await session.scalar(select(Clan).where(Clan.clan_name == payload.clan_name)):
        raise ApiError(status_code=409, message="A clan with this name already exists")
    clan = Clan(**payload.model_dump())
    session.add(clan)
    await session.flush()
    record_audit(
        session,
        actor_user_id=current_user.id,
        action="clan.created",
        entity_type="clan",
        entity_id=clan.id,
        details=payload.model_dump(),
    )
    await session.commit()
    await session.refresh(clan)
    return ClanRead.model_validate(clan)


@router.patch("/{clan_id}", response_model=ClanRead)
async def update_clan(
    clan_id: UUID,
    payload: ClanUpdate,
    current_user: Annotated[User, Depends(require_roles("Admin", "Registrar"))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ClanRead:
    clan = await session.get(Clan, str(clan_id))
    if clan is None:
        raise ApiError(status_code=404, message="Clan not found")
    changes = payload.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(clan, field, value)
    record_audit(
        session,
        actor_user_id=current_user.id,
        action="clan.updated",
        entity_type="clan",
        entity_id=clan.id,
        details=changes,
    )
    await session.commit()
    await session.refresh(clan)
    return ClanRead.model_validate(clan)
