"""add a connected generation across two families

Revision ID: 202609270001
Revises: 202609070001
Create Date: 2026-09-27
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "202609270001"
down_revision: str | None = "202609070001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    persons = sa.table(
        "persons",
        sa.column("id", sa.String),
        sa.column("full_name", sa.String),
        sa.column("email", sa.String),
        sa.column("phone_number", sa.String),
        sa.column("gender", sa.String),
        sa.column("is_deceased", sa.Boolean),
        sa.column("clan_id", sa.String),
        sa.column("family_id", sa.String),
        sa.column("origin_community", sa.String),
        sa.column("notes", sa.String),
    )
    edges = sa.table(
        "kinship_edges",
        sa.column("id", sa.String),
        sa.column("source_person_id", sa.String),
        sa.column("target_person_id", sa.String),
        sa.column("relationship_type", sa.String),
        sa.column("confidence_score", sa.Float),
        sa.column("recorded_by", sa.String),
    )

    op.bulk_insert(
        persons,
        [
            {
                "id": _seed_uuid(501),
                "full_name": "Ifunanya Eze",
                "email": None,
                "phone_number": None,
                "gender": "female",
                "is_deceased": False,
                "clan_id": _seed_uuid(11),
                "family_id": _seed_uuid(21),
                "origin_community": "Mbaise, Imo",
                "notes": "Synthetic cross-family demonstration record.",
            },
            {
                "id": _seed_uuid(502),
                "full_name": "Chibuzor Eze",
                "email": None,
                "phone_number": None,
                "gender": "male",
                "is_deceased": False,
                "clan_id": _seed_uuid(11),
                "family_id": _seed_uuid(21),
                "origin_community": "Mbaise, Imo",
                "notes": "Synthetic cross-family demonstration record.",
            },
        ],
    )
    op.bulk_insert(
        edges,
        [
            _edge(601, 133, 166, "MARRIED_TO"),
            _edge(602, 501, 133, "CHILD_OF"),
            _edge(603, 501, 166, "CHILD_OF"),
            _edge(604, 502, 133, "CHILD_OF"),
            _edge(605, 502, 166, "CHILD_OF"),
        ],
    )


def downgrade() -> None:
    edges = sa.table("kinship_edges", sa.column("id", sa.String))
    persons = sa.table("persons", sa.column("id", sa.String))
    seeded_edge_ids = [_seed_uuid(number) for number in range(601, 606)]
    op.execute(edges.delete().where(edges.c.id.in_(seeded_edge_ids)))
    op.execute(persons.delete().where(persons.c.id.in_([_seed_uuid(501), _seed_uuid(502)])))


def _edge(
    number: int,
    source_id: int,
    target_id: int,
    relationship_type: str,
) -> dict[str, object]:
    return {
        "id": _seed_uuid(number),
        "source_person_id": _seed_uuid(source_id),
        "target_person_id": _seed_uuid(target_id),
        "relationship_type": relationship_type,
        "confidence_score": 1.0,
        "recorded_by": _seed_uuid(1),
    }


def _seed_uuid(number: int) -> str:
    return f"00000000-0000-4000-8000-{number:012d}"
