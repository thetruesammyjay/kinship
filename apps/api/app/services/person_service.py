from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ApiError
from app.models.kinship_edge import KinshipEdge
from app.models.person import Person
from app.schemas.person import PersonCreate, PersonRead, RelationshipRead, RelationshipType


class PersonService:
    async def create_person(self, session: AsyncSession, payload: PersonCreate) -> PersonRead:
        person = Person(**self._person_payload(payload))
        session.add(person)
        await session.commit()
        await session.refresh(person)
        return self._to_person_read(person)

    async def get_person(self, session: AsyncSession, person_id: UUID) -> PersonRead:
        person = await session.get(Person, str(person_id))
        if person is None:
            raise ApiError(status_code=404, message="Person not found")
        return self._to_person_read(person)

    async def search_people(
        self,
        session: AsyncSession,
        query: str | None = None,
    ) -> list[PersonRead]:
        statement = select(Person).order_by(Person.full_name)
        if not query:
            result = await session.scalars(statement)
            return [self._to_person_read(person) for person in result.all()]

        pattern = f"%{query}%"
        result = await session.scalars(
            statement.where(
                or_(
                    Person.full_name.ilike(pattern),
                    Person.email.ilike(pattern),
                    Person.phone_number.ilike(pattern),
                )
            )
        )
        return [self._to_person_read(person) for person in result.all()]

    async def add_relationship(
        self,
        session: AsyncSession,
        source_person_id: UUID,
        target_person_id: UUID,
        relationship_type: RelationshipType,
    ) -> RelationshipRead:
        await self.get_person(session, source_person_id)
        await self.get_person(session, target_person_id)

        relationship = KinshipEdge(
            source_person_id=str(source_person_id),
            target_person_id=str(target_person_id),
            relationship_type=relationship_type.value,
        )
        session.add(relationship)
        try:
            await session.commit()
        except IntegrityError:
            await session.rollback()
            result = await session.scalars(
                select(KinshipEdge).where(
                    KinshipEdge.source_person_id == str(source_person_id),
                    KinshipEdge.target_person_id == str(target_person_id),
                    KinshipEdge.relationship_type == relationship_type.value,
                )
            )
            relationship = result.one()
        else:
            await session.refresh(relationship)

        return self._to_relationship_read(relationship)

    async def relationships(self, session: AsyncSession) -> list[RelationshipRead]:
        result = await session.scalars(select(KinshipEdge))
        return [self._to_relationship_read(relationship) for relationship in result.all()]

    def _person_payload(self, payload: PersonCreate) -> dict[str, object]:
        data = payload.model_dump()
        for key in ("clan_id", "family_id"):
            if data.get(key) is not None:
                data[key] = str(data[key])
        data["gender"] = payload.gender.value
        return data

    def _to_person_read(self, person: Person) -> PersonRead:
        return PersonRead.model_validate(person)

    def _to_relationship_read(self, relationship: KinshipEdge) -> RelationshipRead:
        return RelationshipRead(
            source_person_id=UUID(relationship.source_person_id),
            target_person_id=UUID(relationship.target_person_id),
            relationship_type=RelationshipType(relationship.relationship_type),
            confidence_score=relationship.confidence_score,
        )



person_service = PersonService()
