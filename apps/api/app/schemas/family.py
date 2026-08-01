from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FamilyCreate(BaseModel):
    family_name: str = Field(min_length=1, max_length=200)
    origin_community: str | None = Field(default=None, max_length=200)


class FamilyRead(FamilyCreate):
    id: UUID

    model_config = ConfigDict(from_attributes=True)


class FamilyTreeNode(BaseModel):
    id: UUID
    label: str
    kind: str = "person"


class FamilyTreeEdge(BaseModel):
    source: UUID
    target: UUID
    relationship_type: str


class FamilyTreeRead(BaseModel):
    family_id: UUID
    nodes: list[FamilyTreeNode]
    edges: list[FamilyTreeEdge]
