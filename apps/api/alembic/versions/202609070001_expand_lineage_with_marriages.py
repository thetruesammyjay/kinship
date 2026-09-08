"""expand seeded lineage with co-parents and marriages

Revision ID: 202609070001
Revises: 202608300001
Create Date: 2026-09-07

The first lineage seed established three multi-generation graphs. This
revision adds co-parent links for married couples and additional marriages
between branches so the family tree contains realistic junctions.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "202609070001"
down_revision: str | None = "202608300001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    edges = sa.table(
        "kinship_edges",
        sa.column("id", sa.String),
        sa.column("source_person_id", sa.String),
        sa.column("target_person_id", sa.String),
        sa.column("relationship_type", sa.String),
        sa.column("confidence_score", sa.Float),
        sa.column("recorded_by", sa.String),
    )
    op.bulk_insert(edges, _expanded_edges())


def downgrade() -> None:
    edges = sa.table("kinship_edges", sa.column("id", sa.String))
    op.execute(
        edges.delete().where(
            edges.c.id.in_(
                [_seed_uuid(number) for number in range(401, 401 + len(_expanded_edges()))]
            )
        )
    )


def _expanded_edges() -> list[dict[str, object]]:
    relationships: list[tuple[int, int, str]] = [
        # Rivers: add co-parents and marriages between existing branches.
        (6, 5, "CHILD_OF"),
        (12, 11, "CHILD_OF"),
        (13, 11, "CHILD_OF"),
        (22, 21, "CHILD_OF"),
        (23, 21, "CHILD_OF"),
        (30, 21, "CHILD_OF"),
        (24, 28, "CHILD_OF"),
        (29, 28, "CHILD_OF"),
        (7, 8, "MARRIED_TO"),
        (17, 25, "MARRIED_TO"),
        # Imo: connect married partners as co-parents and join branches.
        (46, 45, "CHILD_OF"),
        (51, 50, "CHILD_OF"),
        (56, 55, "CHILD_OF"),
        (57, 55, "CHILD_OF"),
        (40, 47, "MARRIED_TO"),
        (43, 53, "MARRIED_TO"),
        (50, 58, "MARRIED_TO"),
        (65, 52, "MARRIED_TO"),
        # Anambra: add co-parents and marriages across the three branches.
        (78, 77, "CHILD_OF"),
        (79, 77, "CHILD_OF"),
        (88, 87, "CHILD_OF"),
        (89, 87, "CHILD_OF"),
        (83, 82, "CHILD_OF"),
        (84, 82, "CHILD_OF"),
        (73, 83, "MARRIED_TO"),
        (75, 85, "MARRIED_TO"),
        (83, 91, "MARRIED_TO"),
        (90, 96, "MARRIED_TO"),
    ]
    return [
        _edge(401 + index, source_index, target_index, relationship_type)
        for index, (source_index, target_index, relationship_type) in enumerate(relationships)
    ]


def _edge(
    number: int, source_index: int, target_index: int, relationship_type: str
) -> dict[str, object]:
    return {
        "id": _seed_uuid(number),
        "source_person_id": _seed_uuid(101 + source_index),
        "target_person_id": _seed_uuid(101 + target_index),
        "relationship_type": relationship_type,
        "confidence_score": 1.0,
        "recorded_by": _seed_uuid(1),
    }


def _seed_uuid(number: int) -> str:
    return f"00000000-0000-4000-8000-{number:012d}"
