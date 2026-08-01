from collections import deque
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ApiError
from app.schemas.kinship import (
    KinshipStatus,
    KinshipVerifyResponse,
    RelationshipPathStep,
)
from app.schemas.person import RelationshipType
from app.services.person_service import PersonService


class KinshipEngine:
    def __init__(self, person_service: PersonService, relatedness_threshold_degree: int) -> None:
        self.person_service = person_service
        self.relatedness_threshold_degree = relatedness_threshold_degree

    async def verify_relationship(
        self,
        session: AsyncSession,
        person_a_id: UUID,
        person_b_id: UUID,
    ) -> KinshipVerifyResponse:
        if person_a_id == person_b_id:
            person = await self.person_service.get_person(session, person_a_id)
            return KinshipVerifyResponse(
                status=KinshipStatus.closely_related,
                degree=0,
                common_ancestor_id=person.id,
                path=[RelationshipPathStep(person_id=person.id, full_name=person.full_name)],
                message="The selected records refer to the same person.",
            )

        await self.person_service.get_person(session, person_a_id)
        await self.person_service.get_person(session, person_b_id)

        parent_map = await self._parent_map(session)
        ancestors_a = self._ancestor_distances(person_a_id, parent_map)
        ancestors_b = self._ancestor_distances(person_b_id, parent_map)
        shared_ancestors = set(ancestors_a).intersection(ancestors_b)

        if not shared_ancestors:
            return KinshipVerifyResponse(
                status=KinshipStatus.unrelated,
                degree=None,
                common_ancestor_id=None,
                path=[],
                message="No shared ancestor was found within the recorded lineage graph.",
            )

        common_ancestor_id = min(
            shared_ancestors,
            key=lambda ancestor_id: ancestors_a[ancestor_id] + ancestors_b[ancestor_id],
        )
        path_length = ancestors_a[common_ancestor_id] + ancestors_b[common_ancestor_id]
        degree = max(1, path_length - 1)
        status = (
            KinshipStatus.closely_related
            if degree <= self.relatedness_threshold_degree
            else KinshipStatus.distantly_related
        )

        return KinshipVerifyResponse(
            status=status,
            degree=degree,
            common_ancestor_id=common_ancestor_id,
            path=await self._path_steps(session, [person_a_id, common_ancestor_id, person_b_id]),
            message=f"Shared ancestor found with computed relatedness degree {degree}.",
        )

    async def _parent_map(self, session: AsyncSession) -> dict[UUID, set[UUID]]:
        parent_map: dict[UUID, set[UUID]] = {}
        for relationship in await self.person_service.relationships(session):
            if relationship.relationship_type == RelationshipType.child_of:
                parent_map.setdefault(relationship.source_person_id, set()).add(
                    relationship.target_person_id
                )
            elif relationship.relationship_type == RelationshipType.parent_of:
                parent_map.setdefault(relationship.target_person_id, set()).add(
                    relationship.source_person_id
                )
        return parent_map

    def _ancestor_distances(
        self,
        person_id: UUID,
        parent_map: dict[UUID, set[UUID]],
    ) -> dict[UUID, int]:
        distances: dict[UUID, int] = {}
        queue: deque[tuple[UUID, int]] = deque([(person_id, 0)])

        while queue:
            current_id, distance = queue.popleft()
            for parent_id in parent_map.get(current_id, set()):
                if parent_id not in distances:
                    distances[parent_id] = distance + 1
                    queue.append((parent_id, distance + 1))

        return distances

    async def _path_steps(
        self,
        session: AsyncSession,
        person_ids: list[UUID],
    ) -> list[RelationshipPathStep]:
        steps: list[RelationshipPathStep] = []
        seen: set[UUID] = set()
        for person_id in person_ids:
            if person_id in seen:
                continue
            seen.add(person_id)
            try:
                person = await self.person_service.get_person(session, person_id)
            except ApiError:
                continue
            steps.append(RelationshipPathStep(person_id=person.id, full_name=person.full_name))
        return steps
