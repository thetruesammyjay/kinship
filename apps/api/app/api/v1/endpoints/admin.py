from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
async def admin_status() -> dict[str, str]:
    return {"status": "admin endpoints ready"}
