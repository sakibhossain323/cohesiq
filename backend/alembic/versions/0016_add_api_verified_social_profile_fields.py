"""add api verified social profile fields

Revision ID: 0016
Revises: 0015
Create Date: 2026-06-06
"""
from typing import Union

from alembic import op
import sqlalchemy as sa

revision: str = "0016"
down_revision: Union[str, None] = "0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "creator_social_profiles",
        sa.Column("is_api_verified", sa.Boolean(), server_default="false", nullable=False),
    )
    op.add_column(
        "creator_social_profiles",
        sa.Column("api_verified_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "creator_social_profiles",
        sa.Column("api_channel_id", sa.String(255), nullable=True),
    )
    op.add_column(
        "creator_social_profiles",
        sa.Column(
            "data_source",
            sa.String(30),
            server_default="self_reported",
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("creator_social_profiles", "data_source")
    op.drop_column("creator_social_profiles", "api_channel_id")
    op.drop_column("creator_social_profiles", "api_verified_at")
    op.drop_column("creator_social_profiles", "is_api_verified")
