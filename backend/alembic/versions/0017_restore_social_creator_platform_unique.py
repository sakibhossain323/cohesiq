"""restore social creator platform unique constraint

Revision ID: 0017
Revises: 0016
Create Date: 2026-06-06
"""
from typing import Union

from alembic import op

revision: str = "0017"
down_revision: Union[str, None] = "0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_social_creator_platform",
        "creator_social_profiles",
        ["creator_id", "platform"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_social_creator_platform",
        "creator_social_profiles",
        type_="unique",
    )
