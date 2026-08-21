from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base


class EvaluationMetric(Base):
    __tablename__ = "evaluation_metrics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    metric_type: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    expected_status: Mapped[str | None] = mapped_column(String(80), nullable=True)
    actual_status: Mapped[str | None] = mapped_column(String(80), nullable=True)
    response_time_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    sus_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    submitted_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
