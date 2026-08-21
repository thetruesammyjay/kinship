import json

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.governance import AuditLog


def record_audit(
    session: AsyncSession,
    *,
    actor_user_id: str | None,
    action: str,
    entity_type: str,
    entity_id: str | None,
    details: dict[str, object] | None = None,
) -> None:
    session.add(
        AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=json.dumps(details, sort_keys=True) if details else None,
        )
    )
