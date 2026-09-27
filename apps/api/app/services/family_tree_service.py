from collections import deque
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.person import Family
from app.schemas.family import FamilyTreeEdge, FamilyTreeNode, FamilyTreeRead
from app.services.person_service import PersonService


class FamilyTreeService:
    def __init__(self, person_service: PersonService) -> None:
        self.person_service = person_service

    async def build_tree(self, session: AsyncSession, family_id: UUID) -> FamilyTreeRead:
        focus_people = await self.person_service.search_people(session, family_id=family_id)
        focus_ids = {str(person.id) for person in focus_people}
        relationships = await self.person_service.relationships(session)

        neighbors: dict[str, set[str]] = {}
        for relationship in relationships:
            source_id = str(relationship.source_person_id)
            target_id = str(relationship.target_person_id)
            neighbors.setdefault(source_id, set()).add(target_id)
            neighbors.setdefault(target_id, set()).add(source_id)

        connected_ids = set(focus_ids)
        pending = deque(focus_ids)
        while pending:
            person_id = pending.popleft()
            for neighbor_id in neighbors.get(person_id, set()):
                if neighbor_id not in connected_ids:
                    connected_ids.add(neighbor_id)
                    pending.append(neighbor_id)

        people = await self.person_service.get_people_by_ids(session, connected_ids)
        connected_relationships = [
            relationship
            for relationship in relationships
            if str(relationship.source_person_id) in connected_ids
            and str(relationship.target_person_id) in connected_ids
        ]

        family_ids = {str(person.family_id) for person in people if person.family_id}
        family_rows = await session.scalars(select(Family).where(Family.id.in_(family_ids)))
        family_names = {family.id: family.family_name for family in family_rows.all()}

        return FamilyTreeRead(
            family_id=family_id,
            nodes=[
                FamilyTreeNode(
                    id=person.id,
                    label=person.full_name,
                    family_id=person.family_id,
                    family_name=family_names.get(str(person.family_id))
                    if person.family_id
                    else None,
                    is_focus_family=person.family_id == family_id,
                )
                for person in people
            ],
            edges=[
                FamilyTreeEdge(
                    source=relationship.source_person_id,
                    target=relationship.target_person_id,
                    relationship_type=relationship.relationship_type,
                )
                for relationship in connected_relationships
            ],
        )
