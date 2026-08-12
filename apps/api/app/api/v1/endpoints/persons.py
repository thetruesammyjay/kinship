from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db_session
from app.dependencies import get_current_user, get_person_service
from app.models.user import User
from app.schemas.person import (
    PersonCreate,
    PersonRead,
    PersonSearchResult,
    RelationshipCreate,
    RelationshipRead,
    RelationshipType,
)
from app.services.person_service import PersonService

router = APIRouter()


@router.post("", response_model=PersonRead, status_code=status.HTTP_201_CREATED)
async def create_person(
    payload: PersonCreate,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    service: Annotated[PersonService, Depends(get_person_service)],
    _: Annotated[User, Depends(get_current_user)],
) -> PersonRead:
    return await service.create_person(session, payload)


@router.get("/search", response_model=PersonSearchResult)
async def search_people(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    service: Annotated[PersonService, Depends(get_person_service)],
    q: Annotated[str | None, Query()] = None,
) -> PersonSearchResult:
    people = await service.search_people(session, q)
    return PersonSearchResult(items=people, total=len(people))


@router.get("/{person_id}", response_model=PersonRead)
async def get_person(
    person_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    service: Annotated[PersonService, Depends(get_person_service)],
) -> PersonRead:
    return await service.get_person(session, person_id)


@router.post("/{person_id}/parents", response_model=RelationshipRead)
async def add_parent(
    person_id: UUID,
    payload: RelationshipCreate,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    service: Annotated[PersonService, Depends(get_person_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> RelationshipRead:
    return await service.add_relationship(
        session=session,
        source_person_id=person_id,
        target_person_id=payload.target_person_id,
        relationship_type=RelationshipType.child_of,
        recorded_by=current_user.id,
    )


@router.post("/{person_id}/spouse", response_model=RelationshipRead)
async def add_spouse(
    person_id: UUID,
    payload: RelationshipCreate,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    service: Annotated[PersonService, Depends(get_person_service)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> RelationshipRead:
    return await service.add_relationship(
        session=session,
        source_person_id=person_id,
        target_person_id=payload.target_person_id,
        relationship_type=RelationshipType.married_to,
        recorded_by=current_user.id,
    )
