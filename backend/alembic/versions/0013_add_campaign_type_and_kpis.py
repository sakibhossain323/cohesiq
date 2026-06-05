"""add campaign_type enum and kpi/hashtag columns

Revision ID: 0013_campaign_type_kpis
Revises: fd300ea6267e
Create Date: 2026-06-04 00:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0013_campaign_type_kpis"
down_revision: Union[str, None] = "fd300ea6267e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TYPE campaign_type AS ENUM (
            'paid_content',
            'product_gifting',
            'affiliate',
            'brand_ambassador',
            'talent_booking',
            'ugc_only'
        )
    """)

    op.add_column(
        "campaigns",
        sa.Column(
            "campaign_type",
            sa.Enum(
                "paid_content", "product_gifting", "affiliate",
                "brand_ambassador", "talent_booking", "ugc_only",
                name="campaign_type",
                create_type=False,
            ),
            nullable=True,
            server_default="paid_content",
        ),
    )

    op.add_column(
        "campaigns",
        sa.Column("kpi_targets", JSONB, nullable=True),
    )

    op.add_column(
        "campaigns",
        sa.Column(
            "hashtags",
            sa.ARRAY(sa.Text),
            nullable=False,
            server_default="{}",
        ),
    )

    op.add_column(
        "campaigns",
        sa.Column("tracking_notes", sa.Text, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("campaigns", "tracking_notes")
    op.drop_column("campaigns", "hashtags")
    op.drop_column("campaigns", "kpi_targets")
    op.drop_column("campaigns", "campaign_type")
    op.execute("DROP TYPE campaign_type")
