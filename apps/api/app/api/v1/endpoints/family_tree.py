from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db_session
from app.dependencies import get_person_service
from app.schemas.family import FamilyTreeRead
from app.services.family_tree_service import FamilyTreeService
from app.services.person_service import PersonService

router = APIRouter()


@router.get("/{family_id}/tree", response_model=FamilyTreeRead)
async def get_family_tree(
    family_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    person_service: Annotated[PersonService, Depends(get_person_service)],
) -> FamilyTreeRead:
    return await FamilyTreeService(person_service).build_tree(session, family_id)
