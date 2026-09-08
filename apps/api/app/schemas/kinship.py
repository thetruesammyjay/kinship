from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel


class KinshipStatus(StrEnum):
    unrelated = "Unrelated"
    distantly_related = "Distantly Related"
    closely_related = "Closely Related"


class KinshipRelationship(StrEnum):
    same_person = "Same person"
    parent_child = "Parent-child"
    grandparent_grandchild = "Grandparent-grandchild"
    direct_ancestor = "Direct ancestor relationship"
    siblings = "Siblings"
    aunt_uncle = "Aunt/uncle and niece/nephew"
    first_cousins = "First cousins"
    second_cousins = "Second cousins"
    distant_cousins = "Distant cousins"
    cousins_once_removed = "Cousins once removed"
    spouses = "Spouses"
    unrelated = "Unrelated"


class MarriageDecision(StrEnum):
    eligible = "Eligible to marry"
    not_eligible = "Not eligible to marry"


class KinshipVerifyRequest(BaseModel):
    person_a_id: UUID
    person_b_id: UUID


class RelationshipPathStep(BaseModel):
    person_id: UUID
    full_name: str


class KinshipVerifyResponse(BaseModel):
    status: KinshipStatus
    relationship: KinshipRelationship
    degree: int | None
    common_ancestor_id: UUID | None
    path: list[RelationshipPathStep]
    message: str


class MarriageEligibilityRequest(BaseModel):
    person_a_id: UUID
    person_b_id: UUID


class MarriageEligibilityResponse(BaseModel):
    can_marry: bool
    decision: MarriageDecision
    relationship: KinshipRelationship
    degree: int | None
    common_ancestor_id: UUID | None
    path: list[RelationshipPathStep]
    message: str
