from fastapi import APIRouter

from app.api.v1.endpoints import admin, auth, evaluation, families, family_tree, kinship, persons

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(persons.router, prefix="/persons", tags=["persons"])
api_router.include_router(families.router, prefix="/families", tags=["families"])
api_router.include_router(family_tree.router, prefix="/families", tags=["family-tree"])
api_router.include_router(kinship.router, prefix="/kinship", tags=["kinship"])
api_router.include_router(evaluation.router, prefix="/evaluation", tags=["evaluation"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
