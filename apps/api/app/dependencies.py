from app.config import Settings, get_settings
from app.services.evaluation_service import EvaluationService, evaluation_service
from app.services.kinship_engine import KinshipEngine
from app.services.person_service import PersonService, person_service


def get_app_settings() -> Settings:
    return get_settings()


def get_person_service() -> PersonService:
    return person_service


def get_kinship_engine() -> KinshipEngine:
    return KinshipEngine(
        person_service=person_service,
        relatedness_threshold_degree=get_settings().relatedness_threshold_degree,
    )


def get_evaluation_service() -> EvaluationService:
    return evaluation_service
