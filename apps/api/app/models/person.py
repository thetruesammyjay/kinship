from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base


class Clan(Base):
    __tablename__ = "clans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    clan_name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    region: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Family(Base):
    __tablename__ = "families"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    family_name: Mapped[str] = mapped_column(String(200), nullable=False)
    origin_community: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Person(Base):
    __tablename__ = "persons"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    full_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True, index=True)
    phone_number: Mapped[str | None] = mapped_column(String(32), nullable=True)
    gender: Mapped[str] = mapped_column(String(20), nullable=False, default="unknown")
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_deceased: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    clan_id: Mapped[str | None] = mapped_column(ForeignKey("clans.id"), nullable=True)
    family_id: Mapped[str | None] = mapped_column(ForeignKey("families.id"), nullable=True)
    origin_community: Mapped[str | None] = mapped_column(String(200), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
