from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies import require_roles
from app.models.user import User

router = APIRouter()


@router.get("/status")
async def admin_status(
    _: Annotated[User, Depends(require_roles("Admin"))],
) -> dict[str, str]:
    return {"status": "admin endpoints ready"}
