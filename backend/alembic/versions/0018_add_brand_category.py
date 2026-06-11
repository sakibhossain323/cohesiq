"""add brand category for competitor conflict checks

Revision ID: 0018
Revises: 0017
Create Date: 2026-06-07
"""
from typing import Union

from alembic import op
import sqlalchemy as sa

revision: str = "0018"
down_revision: Union[str, None] = "0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "brand_profiles",
        sa.Column("brand_category", sa.String(50), nullable=True),
    )
    op.add_column(
        "campaigns",
        sa.Column("brand_category", sa.String(50), nullable=True),
    )
    op.create_index(
        "idx_brand_profiles_brand_category",
        "brand_profiles",
        ["brand_category"],
    )
    op.create_index(
        "idx_campaigns_brand_category",
        "campaigns",
        ["brand_category"],
    )


def downgrade() -> None:
    op.drop_index("idx_campaigns_brand_category", table_name="campaigns")
    op.drop_index("idx_brand_profiles_brand_category", table_name="brand_profiles")
    op.drop_column("campaigns", "brand_category")
    op.drop_column("brand_profiles", "brand_category")
