"""initial schema and seed data

Revision ID: 202607310001
Revises:
Create Date: 2026-07-31
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "202607310001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("phone_number", sa.String(length=32), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "clans",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("clan_name", sa.String(length=200), nullable=False, unique=True),
        sa.Column("region", sa.String(length=200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "families",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("family_name", sa.String(length=200), nullable=False),
        sa.Column("origin_community", sa.String(length=200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "persons",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=True),
        sa.Column("phone_number", sa.String(length=32), nullable=True),
        sa.Column("gender", sa.String(length=20), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("is_deceased", sa.Boolean(), nullable=False),
        sa.Column("clan_id", sa.String(length=36), sa.ForeignKey("clans.id"), nullable=True),
        sa.Column("family_id", sa.String(length=36), sa.ForeignKey("families.id"), nullable=True),
        sa.Column("origin_community", sa.String(length=200), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_persons_full_name", "persons", ["full_name"])
    op.create_index("ix_persons_email", "persons", ["email"])

    op.create_table(
        "kinship_edges",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column(
            "source_person_id",
            sa.String(length=36),
            sa.ForeignKey("persons.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "target_person_id",
            sa.String(length=36),
            sa.ForeignKey("persons.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("relationship_type", sa.String(length=50), nullable=False),
        sa.Column("confidence_score", sa.Float(), nullable=False),
        sa.Column("recorded_by", sa.String(length=36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint(
            "source_person_id",
            "target_person_id",
            "relationship_type",
            name="uq_kinship_edge_pair_type",
        ),
    )
    op.create_index("ix_kinship_edges_source_person_id", "kinship_edges", ["source_person_id"])
    op.create_index("ix_kinship_edges_target_person_id", "kinship_edges", ["target_person_id"])
    op.create_index("ix_kinship_edges_relationship_type", "kinship_edges", ["relationship_type"])

    op.create_table(
        "evaluation_metrics",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("metric_type", sa.String(length=80), nullable=False),
        sa.Column("expected_status", sa.String(length=80), nullable=True),
        sa.Column("actual_status", sa.String(length=80), nullable=True),
        sa.Column("response_time_ms", sa.Float(), nullable=True),
        sa.Column("sus_score", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_evaluation_metrics_metric_type", "evaluation_metrics", ["metric_type"])

    _seed_data()


def downgrade() -> None:
    op.drop_table("evaluation_metrics")
    op.drop_table("kinship_edges")
    op.drop_table("persons")
    op.drop_table("families")
    op.drop_table("clans")
    op.drop_table("users")


def _seed_data() -> None:
    users = sa.table(
        "users",
        sa.column("id", sa.String),
        sa.column("full_name", sa.String),
        sa.column("email", sa.String),
        sa.column("phone_number", sa.String),
        sa.column("password_hash", sa.String),
        sa.column("role", sa.String),
        sa.column("is_active", sa.Boolean),
    )
    clans = sa.table(
        "clans",
        sa.column("id", sa.String),
        sa.column("clan_name", sa.String),
        sa.column("region", sa.String),
    )
    families = sa.table(
        "families",
        sa.column("id", sa.String),
        sa.column("family_name", sa.String),
        sa.column("origin_community", sa.String),
    )
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

    admin_id = _seed_uuid(1)
    clan_ids = {
        "Rivers": _seed_uuid(10),
        "Imo": _seed_uuid(11),
        "Anambra": _seed_uuid(12),
    }
    family_ids = {
        "Rivers": _seed_uuid(20),
        "Imo": _seed_uuid(21),
        "Anambra": _seed_uuid(22),
    }

    op.bulk_insert(
        users,
        [
            {
                "id": admin_id,
                "full_name": "Chikaodili Nwosu",
                "email": "chikaodili.nwosu@example.com",
                "phone_number": "+2348000000000",
                "password_hash": "pbkdf2_sha256$seed$placeholder",
                "role": "Admin",
                "is_active": True,
            }
        ],
    )
    op.bulk_insert(
        clans,
        [
            {"id": clan_ids["Rivers"], "clan_name": "Umunna Rivers", "region": "Rivers"},
            {"id": clan_ids["Imo"], "clan_name": "Umunna Imo", "region": "Imo"},
            {"id": clan_ids["Anambra"], "clan_name": "Umunna Anambra", "region": "Anambra"},
        ],
    )
    op.bulk_insert(
        families,
        [
            {
                "id": family_ids["Rivers"],
                "family_name": "Worlu Lineage",
                "origin_community": "Omuma, Rivers",
            },
            {
                "id": family_ids["Imo"],
                "family_name": "Nwosu Lineage",
                "origin_community": "Mbaise, Imo",
            },
            {
                "id": family_ids["Anambra"],
                "family_name": "Okafor Lineage",
                "origin_community": "Nnewi, Anambra",
            },
        ],
    )

    seed_people = _seed_people()
    person_ids = [_seed_uuid(index) for index in range(101, 201)]
    op.bulk_insert(
        persons,
        [
            {
                "id": person_ids[index],
                "full_name": full_name,
                "email": _email_from_name(full_name),
                "phone_number": f"+2348000000{index + 1:03d}",
                "gender": gender,
                "is_deceased": False,
                "clan_id": clan_ids[state],
                "family_id": family_ids[state],
                "origin_community": f"{community}, {state}",
                "notes": f"Seeded Igbo lineage record from {state} State.",
            }
            for index, (full_name, gender, state, community) in enumerate(seed_people)
        ],
    )

    elder_id = person_ids[0]
    parent_a_id = person_ids[1]
    parent_b_id = person_ids[2]
    person_a_id = person_ids[3]
    person_b_id = person_ids[4]
    op.bulk_insert(
        edges,
        [
            {
                "id": _seed_uuid(201),
                "source_person_id": parent_a_id,
                "target_person_id": elder_id,
                "relationship_type": "CHILD_OF",
                "confidence_score": 1.0,
                "recorded_by": admin_id,
            },
            {
                "id": _seed_uuid(202),
                "source_person_id": parent_b_id,
                "target_person_id": elder_id,
                "relationship_type": "CHILD_OF",
                "confidence_score": 1.0,
                "recorded_by": admin_id,
            },
            {
                "id": _seed_uuid(203),
                "source_person_id": person_a_id,
                "target_person_id": parent_a_id,
                "relationship_type": "CHILD_OF",
                "confidence_score": 1.0,
                "recorded_by": admin_id,
            },
            {
                "id": _seed_uuid(204),
                "source_person_id": person_b_id,
                "target_person_id": parent_b_id,
                "relationship_type": "CHILD_OF",
                "confidence_score": 1.0,
                "recorded_by": admin_id,
            },
        ],
    )


def _seed_uuid(number: int) -> str:
    return f"00000000-0000-4000-8000-{number:012d}"


def _email_from_name(full_name: str) -> str:
    slug = ".".join(part.lower().replace("'", "") for part in full_name.split())
    return f"{slug}@example.com"


def _seed_people() -> list[tuple[str, str, str, str]]:
    return [
        ("Nnamdi Worlu", "male", "Rivers", "Omuma"),
        ("Adaeze Worlu", "female", "Rivers", "Omuma"),
        ("Chinedu Worlu", "male", "Rivers", "Omuma"),
        ("Amara Worlu", "female", "Rivers", "Omuma"),
        ("Tobechukwu Worlu", "male", "Rivers", "Omuma"),
        ("Chimamanda Worlu", "female", "Rivers", "Omuma"),
        ("Obinna Worlu", "male", "Rivers", "Omuma"),
        ("Ugochi Worlu", "female", "Rivers", "Omuma"),
        ("Kelechi Worlu", "male", "Rivers", "Omuma"),
        ("Ngozi Worlu", "female", "Rivers", "Omuma"),
        ("Ikenna Nwuke", "male", "Rivers", "Ahoada"),
        ("Chinwe Nwuke", "female", "Rivers", "Ahoada"),
        ("Okechukwu Nwuke", "male", "Rivers", "Ahoada"),
        ("Nkechi Nwuke", "female", "Rivers", "Ahoada"),
        ("Emeka Nwuke", "male", "Rivers", "Ahoada"),
        ("Ifeyinwa Nwuke", "female", "Rivers", "Ahoada"),
        ("Chukwudi Nwuke", "male", "Rivers", "Ahoada"),
        ("Ogechi Nwuke", "female", "Rivers", "Ahoada"),
        ("Chibuike Nwuke", "male", "Rivers", "Ahoada"),
        ("Nkiruka Nwuke", "female", "Rivers", "Ahoada"),
        ("Arinze Emenike", "male", "Rivers", "Etche"),
        ("Chisom Emenike", "female", "Rivers", "Etche"),
        ("Uchenna Emenike", "male", "Rivers", "Etche"),
        ("Nneka Emenike", "female", "Rivers", "Etche"),
        ("Ifeanyi Emenike", "male", "Rivers", "Etche"),
        ("Chiamaka Emenike", "female", "Rivers", "Etche"),
        ("Somtochukwu Emenike", "male", "Rivers", "Etche"),
        ("Oluchi Emenike", "female", "Rivers", "Etche"),
        ("Dubem Emenike", "male", "Rivers", "Etche"),
        ("Adaobi Emenike", "female", "Rivers", "Etche"),
        ("Kachiside Eze", "male", "Rivers", "Oyigbo"),
        ("Chizaram Eze", "female", "Rivers", "Oyigbo"),
        ("Onyeka Eze", "male", "Rivers", "Oyigbo"),
        ("Chikaodili Nwosu", "female", "Imo", "Mbaise"),
        ("Nnanna Nwosu", "male", "Imo", "Mbaise"),
        ("Adaora Nwosu", "female", "Imo", "Mbaise"),
        ("Chukwuma Nwosu", "male", "Imo", "Mbaise"),
        ("Ihuoma Nwosu", "female", "Imo", "Mbaise"),
        ("Ozioma Nwosu", "male", "Imo", "Mbaise"),
        ("Uzoamaka Nwosu", "female", "Imo", "Mbaise"),
        ("Chigozie Nwosu", "male", "Imo", "Mbaise"),
        ("Nnenna Nwosu", "female", "Imo", "Mbaise"),
        ("Ikechukwu Nwosu", "male", "Imo", "Mbaise"),
        ("Amaka Iheanacho", "female", "Imo", "Owerri"),
        ("Chijioke Iheanacho", "male", "Imo", "Owerri"),
        ("Nwakaego Iheanacho", "female", "Imo", "Owerri"),
        ("Onochie Iheanacho", "male", "Imo", "Owerri"),
        ("Chinonso Iheanacho", "female", "Imo", "Owerri"),
        ("Kenechukwu Iheanacho", "male", "Imo", "Owerri"),
        ("Adanna Iheanacho", "female", "Imo", "Owerri"),
        ("Chidiebere Iheanacho", "male", "Imo", "Owerri"),
        ("Nmesoma Iheanacho", "female", "Imo", "Owerri"),
        ("Obioma Iheanacho", "male", "Imo", "Owerri"),
        ("Chinaza Ibekwe", "female", "Imo", "Orlu"),
        ("Eberechi Ibekwe", "male", "Imo", "Orlu"),
        ("Kosisochukwu Ibekwe", "female", "Imo", "Orlu"),
        ("Chukwuebuka Ibekwe", "male", "Imo", "Orlu"),
        ("Munachi Ibekwe", "female", "Imo", "Orlu"),
        ("Nwabueze Ibekwe", "male", "Imo", "Orlu"),
        ("Chinenye Ibekwe", "female", "Imo", "Orlu"),
        ("Odinaka Ibekwe", "male", "Imo", "Orlu"),
        ("Ukamaka Ibekwe", "female", "Imo", "Orlu"),
        ("Chukwunonso Ibekwe", "male", "Imo", "Orlu"),
        ("Ifunanya Nwachukwu", "female", "Imo", "Okigwe"),
        ("Ezeh Nwachukwu", "male", "Imo", "Okigwe"),
        ("Chidimma Nwachukwu", "female", "Imo", "Okigwe"),
        ("Chinedum Okafor", "male", "Anambra", "Nnewi"),
        ("Adaolisa Okafor", "female", "Anambra", "Nnewi"),
        ("Chukwunenye Okafor", "male", "Anambra", "Nnewi"),
        ("Ndidiamaka Okafor", "female", "Anambra", "Nnewi"),
        ("Okwuchukwu Okafor", "male", "Anambra", "Nnewi"),
        ("Chisomaga Okafor", "female", "Anambra", "Nnewi"),
        ("Ifechukwu Okafor", "male", "Anambra", "Nnewi"),
        ("Ngozichukwuka Okafor", "female", "Anambra", "Nnewi"),
        ("Chukwuka Okafor", "male", "Anambra", "Nnewi"),
        ("Adaechezona Okafor", "female", "Anambra", "Nnewi"),
        ("Nduka Ezeani", "male", "Anambra", "Awka"),
        ("Chinyere Ezeani", "female", "Anambra", "Awka"),
        ("Ifeanyichukwu Ezeani", "male", "Anambra", "Awka"),
        ("Nwamaka Ezeani", "female", "Anambra", "Awka"),
        ("Chukwudi Ezeani", "male", "Anambra", "Awka"),
        ("Ogechukwu Ezeani", "female", "Anambra", "Awka"),
        ("Obiora Ezeani", "male", "Anambra", "Awka"),
        ("Chiamaka Ezeani", "female", "Anambra", "Awka"),
        ("Kenechi Ezeani", "male", "Anambra", "Awka"),
        ("Nkeiruka Ezeani", "female", "Anambra", "Awka"),
        ("Okechukwu Obi", "male", "Anambra", "Onitsha"),
        ("Adaobi Obi", "female", "Anambra", "Onitsha"),
        ("Chigozirim Obi", "male", "Anambra", "Onitsha"),
        ("Ugochinyere Obi", "female", "Anambra", "Onitsha"),
        ("Chukwuebuka Obi", "male", "Anambra", "Onitsha"),
        ("Ijeoma Obi", "female", "Anambra", "Onitsha"),
        ("Chibuzor Obi", "male", "Anambra", "Onitsha"),
        ("Nnenne Obi", "female", "Anambra", "Onitsha"),
        ("Ugochukwu Obi", "male", "Anambra", "Onitsha"),
        ("Chika Obi", "female", "Anambra", "Onitsha"),
        ("Ekenedilichukwu Nwankwo", "male", "Anambra", "Aguata"),
        ("Chimamaka Nwankwo", "female", "Anambra", "Aguata"),
        ("Chukwudalu Nwankwo", "male", "Anambra", "Aguata"),
        ("Olamma Nwankwo", "female", "Anambra", "Aguata"),
    ]
