"""add governance records and complete SUS storage

Revision ID: 202608200001
Revises: 202608120001
Create Date: 2026-08-20
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "202608200001"
down_revision: str | None = "202608120001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "evaluation_metrics",
        "sus_score",
        existing_type=sa.Integer(),
        type_=sa.Float(),
        existing_nullable=True,
        postgresql_using="sus_score::double precision",
    )
    op.add_column(
        "evaluation_metrics", sa.Column("submitted_by", sa.String(length=36), nullable=True)
    )
    op.create_foreign_key(
        "fk_evaluation_metrics_submitted_by_users",
        "evaluation_metrics",
        "users",
        ["submitted_by"],
        ["id"],
    )

    op.create_table(
        "disputes",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("submitted_by", sa.String(length=36), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", sa.String(length=36), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("resolution_notes", sa.Text(), nullable=True),
        sa.Column("resolved_by", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["submitted_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["resolved_by"], ["users.id"]),
    )
    op.create_index("ix_disputes_submitted_by", "disputes", ["submitted_by"])
    op.create_index("ix_disputes_entity_id", "disputes", ["entity_id"])
    op.create_index("ix_disputes_status", "disputes", ["status"])

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("actor_user_id", sa.String(length=36), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", sa.String(length=36), nullable=True),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"]),
    )
    op.create_index("ix_audit_logs_actor_user_id", "audit_logs", ["actor_user_id"])
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("disputes")
    op.drop_constraint(
        "fk_evaluation_metrics_submitted_by_users", "evaluation_metrics", type_="foreignkey"
    )
    op.drop_column("evaluation_metrics", "submitted_by")
    op.alter_column(
        "evaluation_metrics",
        "sus_score",
        existing_type=sa.Float(),
        type_=sa.Integer(),
        existing_nullable=True,
        postgresql_using="sus_score::integer",
    )
