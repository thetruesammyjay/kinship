from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel


class KinshipStatus(StrEnum):
    unrelated = "Unrelated"
    distantly_related = "Distantly Related"
    closely_related = "Closely Related"


class KinshipVerifyRequest(BaseModel):
    person_a_id: UUID
    person_b_id: UUID


class RelationshipPathStep(BaseModel):
    person_id: UUID
    full_name: str


class KinshipVerifyResponse(BaseModel):
    status: KinshipStatus
    degree: int | None
    common_ancestor_id: UUID | None
    path: list[RelationshipPathStep]
    message: str
