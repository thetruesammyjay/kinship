from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UserRole(StrEnum):
    admin = "Admin"
    registrar = "Registrar"
    elder = "Elder"
    user = "User"


class UserAdminRead(BaseModel):
    id: UUID
    full_name: str
    email: str
    phone_number: str | None
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserAdminUpdate(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None


class DisputeEntityType(StrEnum):
    person = "person"
    family = "family"
    relationship = "relationship"


class DisputeStatus(StrEnum):
    open = "open"
    under_review = "under_review"
    resolved = "resolved"
    rejected = "rejected"


class DisputeCreate(BaseModel):
    entity_type: DisputeEntityType
    entity_id: UUID
    reason: str = Field(min_length=10, max_length=3000)


class DisputeUpdate(BaseModel):
    status: DisputeStatus
    resolution_notes: str | None = Field(default=None, max_length=3000)


class DisputeRead(BaseModel):
    id: UUID
    submitted_by: UUID
    entity_type: DisputeEntityType
    entity_id: UUID
    reason: str
    status: DisputeStatus
    resolution_notes: str | None
    resolved_by: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogRead(BaseModel):
    id: UUID
    actor_user_id: UUID | None
    action: str
    entity_type: str
    entity_id: UUID | None
    details: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
