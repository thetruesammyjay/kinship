from app.services.person_service import PersonService


class PersonRepository:
    def __init__(self, person_service: PersonService) -> None:
        self.person_service = person_service
