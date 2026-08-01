from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.evaluation_log import EvaluationMetric


@dataclass
class EvaluationService:
    async def accuracy_summary(self, session: AsyncSession) -> dict[str, float | int]:
        rows = (
            await session.execute(
                select(EvaluationMetric.expected_status, EvaluationMetric.actual_status).where(
                    EvaluationMetric.metric_type == "relationship_accuracy"
                )
            )
        ).all()
        total = len(rows)
        correct = sum(1 for expected, actual in rows if expected == actual)
        accuracy = correct / total if total else 0.0
        return {"total_tests": total, "correct_detections": correct, "accuracy": accuracy}

    async def performance_summary(self, session: AsyncSession) -> dict[str, float | int]:
        result = await session.execute(
            select(
                func.count(EvaluationMetric.id),
                func.avg(EvaluationMetric.response_time_ms),
                func.max(EvaluationMetric.response_time_ms),
            ).where(EvaluationMetric.metric_type == "response_time")
        )
        samples, average_ms, max_ms = result.one()
        return {
            "samples": samples,
            "average_ms": float(average_ms or 0.0),
            "max_ms": float(max_ms or 0.0),
        }

    async def sus_summary(self, session: AsyncSession) -> dict[str, float | int | str]:
        result = await session.execute(
            select(func.count(EvaluationMetric.id), func.avg(EvaluationMetric.sus_score)).where(
                EvaluationMetric.metric_type == "sus"
            )
        )
        responses, average_score = result.one()
        score = float(average_score or 0.0)
        interpretation = "excellent" if score >= 80 else "acceptable" if score >= 68 else "low"
        if responses == 0:
            interpretation = "not_enough_data"
        return {"responses": responses, "average_score": score, "interpretation": interpretation}


evaluation_service = EvaluationService()
