from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db_session
from app.dependencies import get_current_user
from app.models.governance import Dispute
from app.models.user import User
from app.schemas.governance import DisputeCreate, DisputeRead
from app.services.audit_service import record_audit

router = APIRouter()


@router.post("", response_model=DisputeRead, status_code=status.HTTP_201_CREATED)
async def create_dispute(
    payload: DisputeCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> DisputeRead:
    dispute = Dispute(
        submitted_by=current_user.id,
        entity_type=payload.entity_type,
        entity_id=str(payload.entity_id),
        reason=payload.reason,
    )
    session.add(dispute)
    await session.flush()
    record_audit(
        session,
        actor_user_id=current_user.id,
        action="dispute.created",
        entity_type="dispute",
        entity_id=dispute.id,
        details={"subject_type": payload.entity_type, "subject_id": str(payload.entity_id)},
    )
    await session.commit()
    await session.refresh(dispute)
    return DisputeRead.model_validate(dispute)


@router.get("/mine", response_model=list[DisputeRead])
async def list_my_disputes(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[DisputeRead]:
    disputes = await session.scalars(
        select(Dispute)
        .where(Dispute.submitted_by == current_user.id)
        .order_by(Dispute.created_at.desc())
    )
    return [DisputeRead.model_validate(dispute) for dispute in disputes.all()]
