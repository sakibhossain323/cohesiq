"""Add campaign visibility and invitation statuses

Revision ID: 959ef947cd0f
Revises: 53f8d9a8a155
Create Date: 2026-05-30 08:28:07.587844+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '959ef947cd0f'
down_revision: Union[str, None] = '53f8d9a8a155'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add new enum values to application_status
    op.execute("ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'invited'")
    op.execute("ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'declined'")

    # 2. Create campaign_visibility enum type
    op.execute("CREATE TYPE campaign_visibility AS ENUM ('public', 'private')")

    # 3. Add visibility column to campaigns
    op.add_column(
        'campaigns',
        sa.Column(
            'visibility',
            sa.Enum('public', 'private', name='campaign_visibility', create_type=False),
            server_default='public',
            nullable=False
        )
    )


def downgrade() -> None:
    op.drop_column('campaigns', 'visibility')
    op.execute("DROP TYPE campaign_visibility")
    pass
