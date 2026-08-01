from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db_session
from app.dependencies import get_kinship_engine
from app.schemas.kinship import KinshipVerifyRequest, KinshipVerifyResponse
from app.services.kinship_engine import KinshipEngine

router = APIRouter()


@router.post("/verify", response_model=KinshipVerifyResponse)
async def verify_kinship(
    payload: KinshipVerifyRequest,
    session: Annotated[AsyncSession, Depends(get_db_session)],
    engine: Annotated[KinshipEngine, Depends(get_kinship_engine)],
) -> KinshipVerifyResponse:
    return await engine.verify_relationship(session, payload.person_a_id, payload.person_b_id)
