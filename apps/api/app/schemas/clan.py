from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ClanCreate(BaseModel):
    clan_name: str = Field(min_length=1, max_length=200)
    region: str | None = Field(default=None, max_length=200)


class ClanUpdate(BaseModel):
    clan_name: str | None = Field(default=None, min_length=1, max_length=200)
    region: str | None = Field(default=None, max_length=200)


class ClanRead(BaseModel):
    id: UUID
    clan_name: str
    region: str | None

    model_config = ConfigDict(from_attributes=True)
