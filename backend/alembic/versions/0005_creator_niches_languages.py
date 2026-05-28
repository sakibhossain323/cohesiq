"""creator niches and languages junction tables

Revision ID: 0005
Revises: 0004
Create Date: 2026-05-29
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # creator_niches
    op.create_table(
        "creator_niches",
        sa.Column(
            "creator_id",
            UUID(as_uuid=True),
            sa.ForeignKey("creator_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "niche_id",
            sa.Integer(),
            sa.ForeignKey("niches.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("is_primary", sa.Boolean(), server_default="false"),
        sa.PrimaryKeyConstraint("creator_id", "niche_id"),
    )
    op.create_index("idx_creator_niches_niche", "creator_niches", ["niche_id"])

    # creator_languages
    op.create_table(
        "creator_languages",
        sa.Column(
            "creator_id",
            UUID(as_uuid=True),
            sa.ForeignKey("creator_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "language_code",
            sa.CHAR(2),
            sa.ForeignKey("languages.code", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("is_primary", sa.Boolean(), server_default="false"),
        sa.PrimaryKeyConstraint("creator_id", "language_code"),
    )


def downgrade() -> None:
    op.drop_table("creator_languages")
    op.drop_index("idx_creator_niches_niche", table_name="creator_niches")
    op.drop_table("creator_niches")
