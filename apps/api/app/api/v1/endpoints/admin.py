from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ApiError
from app.db.postgres import get_db_session
from app.dependencies import require_roles
from app.models.governance import AuditLog, Dispute
from app.models.user import User
from app.schemas.governance import (
    AuditLogRead,
    DisputeRead,
    DisputeUpdate,
    UserAdminRead,
    UserAdminUpdate,
)
from app.services.audit_service import record_audit

router = APIRouter()


@router.get("/status")
async def admin_status(
    _: Annotated[User, Depends(require_roles("Admin"))],
) -> dict[str, str]:
    return {"status": "admin endpoints ready"}


@router.get("/users", response_model=list[UserAdminRead])
async def list_users(
    _: Annotated[User, Depends(require_roles("Admin"))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[UserAdminRead]:
    users = await session.scalars(select(User).order_by(User.created_at.desc()))
    return [UserAdminRead.model_validate(user) for user in users.all()]


@router.patch("/users/{user_id}", response_model=UserAdminRead)
async def update_user(
    user_id: UUID,
    payload: UserAdminUpdate,
    current_user: Annotated[User, Depends(require_roles("Admin"))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> UserAdminRead:
    user = await session.get(User, str(user_id))
    if user is None:
        raise ApiError(status_code=404, message="User not found")
    if user.id == current_user.id and (
        payload.is_active is False or (payload.role is not None and payload.role != "Admin")
    ):
        raise ApiError(status_code=400, message="You cannot remove your own administrator access")

    changes = payload.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(user, field, value)
    record_audit(
        session,
        actor_user_id=current_user.id,
        action="user.updated",
        entity_type="user",
        entity_id=user.id,
        details=changes,
    )
    await session.commit()
    await session.refresh(user)
    return UserAdminRead.model_validate(user)


@router.get("/disputes", response_model=list[DisputeRead])
async def list_disputes(
    _: Annotated[User, Depends(require_roles("Admin"))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[DisputeRead]:
    disputes = await session.scalars(select(Dispute).order_by(Dispute.created_at.desc()))
    return [DisputeRead.model_validate(dispute) for dispute in disputes.all()]


@router.patch("/disputes/{dispute_id}", response_model=DisputeRead)
async def update_dispute(
    dispute_id: UUID,
    payload: DisputeUpdate,
    current_user: Annotated[User, Depends(require_roles("Admin"))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> DisputeRead:
    dispute = await session.get(Dispute, str(dispute_id))
    if dispute is None:
        raise ApiError(status_code=404, message="Dispute not found")
    dispute.status = payload.status
    dispute.resolution_notes = payload.resolution_notes
    dispute.resolved_by = current_user.id if payload.status in {"resolved", "rejected"} else None
    record_audit(
        session,
        actor_user_id=current_user.id,
        action="dispute.updated",
        entity_type="dispute",
        entity_id=dispute.id,
        details={"status": payload.status, "resolution_notes": payload.resolution_notes or ""},
    )
    await session.commit()
    await session.refresh(dispute)
    return DisputeRead.model_validate(dispute)


@router.get("/audit-logs", response_model=list[AuditLogRead])
async def list_audit_logs(
    _: Annotated[User, Depends(require_roles("Admin"))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[AuditLogRead]:
    logs = await session.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(250))
    return [AuditLogRead.model_validate(log) for log in logs.all()]
