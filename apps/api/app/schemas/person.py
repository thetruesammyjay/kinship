from datetime import date
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class Gender(StrEnum):
    female = "female"
    male = "male"
    other = "other"
    unknown = "unknown"


class RelationshipType(StrEnum):
    child_of = "CHILD_OF"
    parent_of = "PARENT_OF"
    married_to = "MARRIED_TO"
    sibling_of = "SIBLING_OF"
    belongs_to_clan = "BELONGS_TO_CLAN"


class PersonCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=200)
    email: str | None = Field(default=None, max_length=320)
    phone_number: str | None = Field(default=None, max_length=32)
    gender: Gender = Gender.unknown
    date_of_birth: date | None = None
    is_deceased: bool = False
    clan_id: UUID | None = None
    family_id: UUID | None = None
    origin_community: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=2000)


class PersonRead(PersonCreate):
    id: UUID

    model_config = ConfigDict(from_attributes=True)


class PersonSearchResult(BaseModel):
    items: list[PersonRead]
    total: int


class RelationshipCreate(BaseModel):
    target_person_id: UUID


class RelationshipRead(BaseModel):
    source_person_id: UUID
    target_person_id: UUID
    relationship_type: RelationshipType
    confidence_score: float = 1.0

    model_config = ConfigDict(from_attributes=True)
