from collections import deque
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.kinship import (
    KinshipRelationship,
    KinshipStatus,
    KinshipVerifyResponse,
    MarriageDecision,
    MarriageEligibilityResponse,
    RelationshipPathStep,
)
from app.schemas.person import RelationshipRead, RelationshipType
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
        person_a = await self.person_service.get_person(session, person_a_id)
        person_b = await self.person_service.get_person(session, person_b_id)

        if person_a_id == person_b_id:
            return KinshipVerifyResponse(
                status=KinshipStatus.closely_related,
                relationship=KinshipRelationship.same_person,
                degree=0,
                common_ancestor_id=person_a.id,
                path=[RelationshipPathStep(person_id=person_a.id, full_name=person_a.full_name)],
                message=f"{person_a.full_name} is the same person in both selected records.",
            )

        relationships = await self.person_service.relationships(session)
        parent_map = self._parent_map(relationships)

        explicit_relationship = await self._explicit_pair_relationship(
            session,
            person_a_id,
            person_b_id,
            relationships,
            parent_map,
            person_a.full_name,
            person_b.full_name,
        )
        if explicit_relationship is not None:
            return explicit_relationship

        ancestors_a = self._ancestor_paths(person_a_id, parent_map)
        ancestors_b = self._ancestor_paths(person_b_id, parent_map)

        if person_b_id in ancestors_a:
            ancestor_id = person_b_id
            descendant_id = person_a_id
            path_ids = ancestors_a[person_b_id]
            direct_ancestor_distance = len(path_ids) - 1
        elif person_a_id in ancestors_b:
            ancestor_id = person_a_id
            descendant_id = person_b_id
            path_ids = list(reversed(ancestors_b[person_a_id]))
            direct_ancestor_distance = len(path_ids) - 1
        else:
            ancestor_id = None
            descendant_id = None
            path_ids = []
            direct_ancestor_distance = None

        if direct_ancestor_distance is not None:
            relationship = self._direct_ancestor_relationship(direct_ancestor_distance)
            ancestor = person_a if ancestor_id == person_a_id else person_b
            descendant = person_a if descendant_id == person_a_id else person_b
            return KinshipVerifyResponse(
                status=self._status_for_degree(direct_ancestor_distance),
                relationship=relationship,
                degree=direct_ancestor_distance,
                common_ancestor_id=ancestor.id,
                path=await self._path_steps(session, path_ids, parent_map),
                message=(
                    f"The recorded lineage places {ancestor.full_name} "
                    f"{self._link_count(direct_ancestor_distance)} above "
                    f"{descendant.full_name}. The relationship is {relationship.value}."
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
                message=(
                    f"No shared ancestor was found in the recorded lineage for "
                    f"{person_a.full_name} and {person_b.full_name}. This does not prove "
                    "that no relationship exists; some lineage may be missing."
                ),
            )

        common_ancestor_id = min(
            shared_ancestors,
            key=lambda ancestor_id: (
                len(ancestors_a[ancestor_id]) + len(ancestors_b[ancestor_id]),
                str(ancestor_id),
            ),
        )
        path_a = ancestors_a[common_ancestor_id]
        path_b = ancestors_b[common_ancestor_id]
        distance_a = len(path_a) - 1
        distance_b = len(path_b) - 1
        path_ids = path_a + list(reversed(path_b[:-1]))
        path_length = distance_a + distance_b
        degree = max(1, path_length - 1)
        relationship = self._shared_ancestor_relationship(
            distance_a, distance_b
        )
        status = self._status_for_degree(degree)
        common_ancestor = await self.person_service.get_person(session, common_ancestor_id)

        return KinshipVerifyResponse(
            status=status,
            relationship=relationship,
            degree=degree,
            common_ancestor_id=common_ancestor_id,
            path=await self._path_steps(session, path_ids, parent_map),
            message=(
                f"{person_a.full_name} and {person_b.full_name} share "
                f"{common_ancestor.full_name} as a recorded ancestor. "
                f"{person_a.full_name} is {self._link_count(distance_a)} from "
                f"{common_ancestor.full_name}; {person_b.full_name} is "
                f"{self._link_count(distance_b)} from {common_ancestor.full_name}. "
                f"The recorded relationship is {relationship.value.lower()} "
                f"(degree {degree})."
            ),
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
            message = (
                f"{result.message} This check does not assess a new marriage."
            )
        elif result.degree is None:
            message = (
                f"{result.message} Under the current rule, a pair with no shared ancestor "
                "passes the minimum-degree check. This result depends on recorded lineage."
            )
        elif result.relationship in blocked_relationships:
            threshold_note = (
                f" The degree is also below the configured minimum of "
                f"{self.marriage_minimum_degree}."
                if result.degree < self.marriage_minimum_degree
                else ""
            )
            message = (
                f"{result.message} The configured rule blocks "
                f"{result.relationship.value.lower()} relationships.{threshold_note}"
            )
        elif not is_allowed:
            message = (
                f"{result.message} Degree {result.degree} is below the configured minimum "
                f"of {self.marriage_minimum_degree}."
            )
        else:
            message = (
                f"{result.message} Degree {result.degree} meets the configured minimum "
                f"of {self.marriage_minimum_degree}."
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
        relationships: list[RelationshipRead],
        parent_map: dict[UUID, set[UUID]],
        person_a_name: str,
        person_b_name: str,
    ) -> KinshipVerifyResponse | None:
        pair = {
            (person_a_id, person_b_id),
            (person_b_id, person_a_id),
        }
        for relationship in relationships:
            if (relationship.source_person_id, relationship.target_person_id) not in pair:
                continue
            if relationship.relationship_type.value == "MARRIED_TO":
                return KinshipVerifyResponse(
                    status=KinshipStatus.unrelated,
                    relationship=KinshipRelationship.spouses,
                    degree=None,
                    common_ancestor_id=None,
                    path=await self._path_steps(
                        session, [person_a_id, person_b_id], parent_map, "Spouse"
                    ),
                    message=(
                        f"The records mark {person_a_name} and {person_b_name} as spouses. "
                        "A spouse link does not establish a blood relationship."
                    ),
                )
            if relationship.relationship_type.value == "SIBLING_OF":
                return KinshipVerifyResponse(
                    status=KinshipStatus.closely_related,
                    relationship=KinshipRelationship.siblings,
                    degree=1,
                    common_ancestor_id=None,
                    path=await self._path_steps(
                        session, [person_a_id, person_b_id], parent_map, "Sibling"
                    ),
                    message="The records explicitly mark these people as siblings (degree 1).",
                )
        return None

    def _parent_map(
        self, relationships: list[RelationshipRead]
    ) -> dict[UUID, set[UUID]]:
        parent_map: dict[UUID, set[UUID]] = {}
        for relationship in relationships:
            if relationship.relationship_type == RelationshipType.child_of:
                parent_map.setdefault(relationship.source_person_id, set()).add(
                    relationship.target_person_id
                )
            elif relationship.relationship_type == RelationshipType.parent_of:
                parent_map.setdefault(relationship.target_person_id, set()).add(
                    relationship.source_person_id
                )
        return parent_map

    def _ancestor_paths(
        self,
        person_id: UUID,
        parent_map: dict[UUID, set[UUID]],
    ) -> dict[UUID, list[UUID]]:
        paths: dict[UUID, list[UUID]] = {person_id: [person_id]}
        queue: deque[UUID] = deque([person_id])

        while queue:
            current_id = queue.popleft()
            for parent_id in sorted(parent_map.get(current_id, set()), key=str):
                if parent_id not in paths:
                    paths[parent_id] = [*paths[current_id], parent_id]
                    queue.append(parent_id)

        return paths

    def _link_count(self, distance: int) -> str:
        noun = "parent link" if distance == 1 else "parent links"
        return f"{distance} {noun}"

    async def _path_steps(
        self,
        session: AsyncSession,
        person_ids: list[UUID],
        parent_map: dict[UUID, set[UUID]],
        explicit_relationship: str | None = None,
    ) -> list[RelationshipPathStep]:
        people = await self.person_service.get_people_by_ids(
            session, {str(person_id) for person_id in person_ids}
        )
        people_by_id = {person.id: person for person in people}
        steps: list[RelationshipPathStep] = []

        for index, person_id in enumerate(person_ids):
            person = people_by_id.get(person_id)
            if person is None:
                continue
            relation_to_next = None
            if index < len(person_ids) - 1:
                next_id = person_ids[index + 1]
                if explicit_relationship is not None:
                    relation_to_next = explicit_relationship
                elif next_id in parent_map.get(person_id, set()):
                    relation_to_next = "Parent"
                elif person_id in parent_map.get(next_id, set()):
                    relation_to_next = "Child"
                else:
                    relation_to_next = "Related person"
            steps.append(
                RelationshipPathStep(
                    person_id=person.id,
                    full_name=person.full_name,
                    relationship_to_next=relation_to_next,
                )
            )
        return steps
