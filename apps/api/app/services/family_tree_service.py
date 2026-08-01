from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.family import FamilyTreeEdge, FamilyTreeNode, FamilyTreeRead
from app.services.person_service import PersonService


class FamilyTreeService:
    def __init__(self, person_service: PersonService) -> None:
        self.person_service = person_service

    async def build_tree(self, session: AsyncSession, family_id: UUID) -> FamilyTreeRead:
        people = await self.person_service.search_people(session)
        relationships = await self.person_service.relationships(session)
        return FamilyTreeRead(
            family_id=family_id,
            nodes=[FamilyTreeNode(id=person.id, label=person.full_name) for person in people],
            edges=[
                FamilyTreeEdge(
                    source=relationship.source_person_id,
                    target=relationship.target_person_id,
                    relationship_type=relationship.relationship_type,
                )
                for relationship in relationships
            ],
        )
