from collections import deque
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ApiError
from app.schemas.kinship import (
    KinshipRelationship,
    KinshipStatus,
    KinshipVerifyResponse,
    MarriageDecision,
    MarriageEligibilityResponse,
    RelationshipPathStep,
)
from app.schemas.person import RelationshipType
from app.services.person_service import PersonService


class KinshipEngine:
    def __init__(
        self,
        person_service: PersonService,
        relatedness_threshold_degree: int,
        marriage_minimum_degree: int,
    ) -> None:
        self.person_service = person_service
        self.relatedness_threshold_degree = relatedness_threshold_degree
        self.marriage_minimum_degree = marriage_minimum_degree

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
                relationship=KinshipRelationship.same_person,
                degree=0,
                common_ancestor_id=person.id,
                path=[RelationshipPathStep(person_id=person.id, full_name=person.full_name)],
                message="The selected records refer to the same person.",
            )

        await self.person_service.get_person(session, person_a_id)
        await self.person_service.get_person(session, person_b_id)

        explicit_relationship = await self._explicit_pair_relationship(
            session, person_a_id, person_b_id
        )
        if explicit_relationship is not None:
            return explicit_relationship

        parent_map = await self._parent_map(session)
        ancestors_a = self._ancestor_distances(person_a_id, parent_map)
        ancestors_b = self._ancestor_distances(person_b_id, parent_map)

        direct_ancestor_distance = ancestors_a.get(person_b_id)
        if direct_ancestor_distance is None:
            direct_ancestor_distance = ancestors_b.get(person_a_id)
        if direct_ancestor_distance is not None:
            relationship = self._direct_ancestor_relationship(direct_ancestor_distance)
            status = self._status_for_degree(direct_ancestor_distance)
            common_ancestor_id = (
                person_b_id if person_b_id in ancestors_a else person_a_id
            )
            return KinshipVerifyResponse(
                status=status,
                relationship=relationship,
                degree=direct_ancestor_distance,
                common_ancestor_id=common_ancestor_id,
                path=await self._path_steps(session, [person_a_id, person_b_id]),
                message=(
                    f"A direct ancestor path was found: {relationship.value}. "
                    f"Computed lineage distance: {direct_ancestor_distance}."
                ),
            )

        shared_ancestors = set(ancestors_a).intersection(ancestors_b)

        if not shared_ancestors:
            return KinshipVerifyResponse(
                status=KinshipStatus.unrelated,
                relationship=KinshipRelationship.unrelated,
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
        relationship = self._shared_ancestor_relationship(
            ancestors_a[common_ancestor_id], ancestors_b[common_ancestor_id]
        )
        status = self._status_for_degree(degree)

        return KinshipVerifyResponse(
            status=status,
            relationship=relationship,
            degree=degree,
            common_ancestor_id=common_ancestor_id,
            path=await self._path_steps(session, [person_a_id, common_ancestor_id, person_b_id]),
            message=f"Shared ancestor found. The records are {relationship.value.lower()}.",
        )

    async def assess_marriage(
        self,
        session: AsyncSession,
        person_a_id: UUID,
        person_b_id: UUID,
    ) -> MarriageEligibilityResponse:
        result = await self.verify_relationship(session, person_a_id, person_b_id)
        blocked_relationships = {
            KinshipRelationship.same_person,
            KinshipRelationship.parent_child,
            KinshipRelationship.grandparent_grandchild,
            KinshipRelationship.direct_ancestor,
            KinshipRelationship.siblings,
            KinshipRelationship.aunt_uncle,
            KinshipRelationship.first_cousins,
            KinshipRelationship.spouses,
        }
        is_allowed = (
            result.relationship not in blocked_relationships
            and (result.degree is None or result.degree >= self.marriage_minimum_degree)
        )
        if result.relationship == KinshipRelationship.spouses:
            message = "These records are already marked as spouses."
        elif result.relationship in blocked_relationships:
            message = (
                f"Marriage is not permitted for the recorded relationship: "
                f"{result.relationship.value}."
            )
        elif result.degree is None:
            message = "No shared ancestor was found in the recorded lineage graph."
        else:
            message = (
                f"The relationship is {result.relationship.value}. "
                f"The computed degree meets the minimum allowed degree of "
                f"{self.marriage_minimum_degree}."
            )
        return MarriageEligibilityResponse(
            can_marry=is_allowed,
            decision=(
                MarriageDecision.eligible if is_allowed else MarriageDecision.not_eligible
            ),
            relationship=result.relationship,
            degree=result.degree,
            common_ancestor_id=result.common_ancestor_id,
            path=result.path,
            message=message,
        )
    def _status_for_degree(self, degree: int) -> KinshipStatus:
        return (
            KinshipStatus.closely_related
            if degree <= self.relatedness_threshold_degree
            else KinshipStatus.distantly_related
        )

    def _direct_ancestor_relationship(self, distance: int) -> KinshipRelationship:
        if distance == 1:
            return KinshipRelationship.parent_child
        if distance == 2:
            return KinshipRelationship.grandparent_grandchild
        return KinshipRelationship.direct_ancestor

    def _shared_ancestor_relationship(
        self, distance_a: int, distance_b: int
    ) -> KinshipRelationship:
        distances = sorted((distance_a, distance_b))
        if distances == [1, 1]:
            return KinshipRelationship.siblings
        if distances == [1, 2]:
            return KinshipRelationship.aunt_uncle
        if distances == [2, 2]:
            return KinshipRelationship.first_cousins
        if distances == [3, 3]:
            return KinshipRelationship.second_cousins
        if distance_a == distance_b and distance_a >= 4:
            return KinshipRelationship.distant_cousins
        return KinshipRelationship.cousins_once_removed

    async def _explicit_pair_relationship(
        self,
        session: AsyncSession,
        person_a_id: UUID,
        person_b_id: UUID,
    ) -> KinshipVerifyResponse | None:
        pair = {
            (person_a_id, person_b_id),
            (person_b_id, person_a_id),
        }
        for relationship in await self.person_service.relationships(session):
            if (relationship.source_person_id, relationship.target_person_id) not in pair:
                continue
            if relationship.relationship_type.value == "MARRIED_TO":
                return KinshipVerifyResponse(
                    status=KinshipStatus.unrelated,
                    relationship=KinshipRelationship.spouses,
                    degree=None,
                    common_ancestor_id=None,
                    path=await self._path_steps(session, [person_a_id, person_b_id]),
                    message=(
                        "The records are marked as spouses; "
                        "no blood relationship was inferred."
                    ),
                )
            if relationship.relationship_type.value == "SIBLING_OF":
                return KinshipVerifyResponse(
                    status=KinshipStatus.closely_related,
                    relationship=KinshipRelationship.siblings,
                    degree=1,
                    common_ancestor_id=None,
                    path=await self._path_steps(session, [person_a_id, person_b_id]),
                    message="The records are explicitly marked as siblings.",
                )
        return None

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
