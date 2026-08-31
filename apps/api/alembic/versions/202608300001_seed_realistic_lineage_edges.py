"""seed realistic multi-generation lineage edges

Revision ID: 202608300001
Revises: 202608200001
Create Date: 2026-08-30

The initial seed included 100 people but only four relationship edges. This
revision connects the existing people into three illustrative graphs.
CHILD_OF points from child to parent, matching the existing contract.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "202608300001"
down_revision: str | None = "202608200001"
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
    op.bulk_insert(edges, _lineage_edges())


def downgrade() -> None:
    edges = sa.table("kinship_edges", sa.column("id", sa.String))
    op.execute(
        edges.delete().where(
            edges.c.id.in_(
                [_seed_uuid(number) for number in range(301, 301 + len(_lineage_edges()))]
            )
        )
    )


def _lineage_edges() -> list[dict[str, object]]:
    """Build state graphs from existing person IDs 101 through 200."""
    relationships: list[tuple[int, int, str]] = [
        # Rivers: parent-child, sibling, first-cousin, distant-cousin, spouse.
        (5, 1, "MARRIED_TO"),
        (6, 1, "CHILD_OF"),
        (7, 2, "CHILD_OF"),
        (8, 3, "CHILD_OF"),
        (9, 4, "CHILD_OF"),
        (10, 0, "CHILD_OF"),
        (11, 10, "MARRIED_TO"),
        (12, 10, "CHILD_OF"),
        (13, 10, "CHILD_OF"),
        (14, 12, "CHILD_OF"),
        (15, 13, "CHILD_OF"),
        (16, 12, "MARRIED_TO"),
        (17, 12, "CHILD_OF"),
        (18, 14, "CHILD_OF"),
        (19, 15, "CHILD_OF"),
        (20, 0, "CHILD_OF"),
        (21, 20, "MARRIED_TO"),
        (22, 20, "CHILD_OF"),
        (23, 20, "CHILD_OF"),
        (24, 22, "CHILD_OF"),
        (25, 23, "CHILD_OF"),
        (26, 24, "CHILD_OF"),
        (27, 25, "CHILD_OF"),
        (28, 22, "MARRIED_TO"),
        (29, 22, "CHILD_OF"),
        (30, 20, "CHILD_OF"),
        (31, 30, "CHILD_OF"),
        (32, 31, "CHILD_OF"),
        # Imo: a second multi-generation graph.
        (34, 33, "CHILD_OF"),
        (35, 33, "CHILD_OF"),
        (36, 34, "CHILD_OF"),
        (37, 34, "CHILD_OF"),
        (38, 35, "CHILD_OF"),
        (39, 35, "CHILD_OF"),
        (40, 36, "CHILD_OF"),
        (41, 37, "CHILD_OF"),
        (42, 38, "CHILD_OF"),
        (43, 39, "CHILD_OF"),
        (44, 33, "CHILD_OF"),
        (45, 44, "MARRIED_TO"),
        (46, 44, "CHILD_OF"),
        (47, 44, "CHILD_OF"),
        (48, 46, "CHILD_OF"),
        (49, 47, "CHILD_OF"),
        (50, 46, "MARRIED_TO"),
        (51, 46, "CHILD_OF"),
        (52, 48, "CHILD_OF"),
        (53, 49, "CHILD_OF"),
        (54, 33, "CHILD_OF"),
        (55, 54, "MARRIED_TO"),
        (56, 54, "CHILD_OF"),
        (57, 54, "CHILD_OF"),
        (58, 56, "CHILD_OF"),
        (59, 57, "CHILD_OF"),
        (60, 58, "CHILD_OF"),
        (61, 59, "CHILD_OF"),
        (62, 60, "CHILD_OF"),
        (63, 61, "CHILD_OF"),
        (64, 62, "CHILD_OF"),
        (65, 63, "CHILD_OF"),
        # Anambra: a third multi-generation graph.
        (67, 66, "CHILD_OF"),
        (68, 66, "CHILD_OF"),
        (69, 67, "CHILD_OF"),
        (70, 67, "CHILD_OF"),
        (71, 68, "CHILD_OF"),
        (72, 68, "CHILD_OF"),
        (73, 69, "CHILD_OF"),
        (74, 70, "CHILD_OF"),
        (75, 71, "CHILD_OF"),
        (76, 66, "CHILD_OF"),
        (77, 76, "MARRIED_TO"),
        (78, 76, "CHILD_OF"),
        (79, 76, "CHILD_OF"),
        (80, 78, "CHILD_OF"),
        (81, 79, "CHILD_OF"),
        (82, 78, "MARRIED_TO"),
        (83, 78, "CHILD_OF"),
        (84, 80, "CHILD_OF"),
        (85, 81, "CHILD_OF"),
        (86, 66, "CHILD_OF"),
        (87, 86, "MARRIED_TO"),
        (88, 86, "CHILD_OF"),
        (89, 86, "CHILD_OF"),
        (90, 88, "CHILD_OF"),
        (91, 89, "CHILD_OF"),
        (92, 90, "CHILD_OF"),
        (93, 91, "CHILD_OF"),
        (94, 92, "CHILD_OF"),
        (95, 93, "CHILD_OF"),
        (96, 94, "CHILD_OF"),
        (97, 95, "CHILD_OF"),
        (98, 96, "CHILD_OF"),
        (99, 97, "CHILD_OF"),
    ]
    return [
        _edge(301 + index, source_index, target_index, relationship_type)
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
