"""link families to clans

Revision ID: 202608120001
Revises: 202607310001
Create Date: 2026-08-12
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "202608120001"
down_revision: str | None = "202607310001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("families", sa.Column("clan_id", sa.String(length=36), nullable=True))
    op.create_foreign_key(
        "fk_families_clan_id_clans",
        "families",
        "clans",
        ["clan_id"],
        ["id"],
    )
    op.create_index("ix_families_clan_id", "families", ["clan_id"])
    op.execute(
        """
        UPDATE families AS family
        SET clan_id = membership.clan_id
        FROM (
            SELECT family_id, MIN(clan_id) AS clan_id
            FROM persons
            WHERE family_id IS NOT NULL AND clan_id IS NOT NULL
            GROUP BY family_id
        ) AS membership
        WHERE family.id = membership.family_id
        """
    )


def downgrade() -> None:
    op.drop_index("ix_families_clan_id", table_name="families")
    op.drop_constraint("fk_families_clan_id_clans", "families", type_="foreignkey")
    op.drop_column("families", "clan_id")
