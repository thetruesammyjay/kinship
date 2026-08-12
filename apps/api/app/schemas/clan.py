from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ClanRead(BaseModel):
    id: UUID
    clan_name: str
    region: str | None

    model_config = ConfigDict(from_attributes=True)
