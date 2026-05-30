"""add archived to campaign_status

Revision ID: fd300ea6267e
Revises: 959ef947cd0f
Create Date: 2026-05-30 09:41:59.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fd300ea6267e'
down_revision: Union[str, None] = '959ef947cd0f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE campaign_status ADD VALUE IF NOT EXISTS 'archived'")
    pass


def downgrade() -> None:
    pass
