from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db_session
from app.models.person import Clan
from app.schemas.clan import ClanRead

router = APIRouter()


@router.get("", response_model=list[ClanRead])
async def list_clans(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[ClanRead]:
    clans = await session.scalars(select(Clan).order_by(Clan.region, Clan.clan_name))
    return [ClanRead.model_validate(clan) for clan in clans.all()]
