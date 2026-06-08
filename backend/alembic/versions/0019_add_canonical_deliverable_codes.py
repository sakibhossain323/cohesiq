"""add canonical deliverable codes and suggested creator pricing

Revision ID: 0019
Revises: 0018
Create Date: 2026-06-08
"""
from typing import Union

from alembic import op
import sqlalchemy as sa

revision: str = "0019"
down_revision: Union[str, None] = "0018"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "campaign_deliverable_requirements",
        sa.Column("deliverable_code", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "creator_rate_cards",
        sa.Column("deliverable_code", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "creator_rate_cards",
        sa.Column("suggested_price_bdt", sa.Integer(), nullable=True),
    )

    op.execute(
        """
        UPDATE campaign_deliverable_requirements
        SET deliverable_code = CASE
            WHEN platform = 'youtube' AND deliverable_type = 'live_stream' THEN 'youtube_live'
            WHEN platform = 'youtube' AND deliverable_type = 'short_video' THEN 'youtube_short'
            WHEN platform = 'youtube' AND deliverable_type IN ('dedicated_video', 'integrated_mention') THEN 'youtube_video'
            WHEN platform = 'instagram' AND deliverable_type = 'live_stream' THEN 'instagram_live'
            WHEN platform = 'instagram' AND deliverable_type = 'photo_post' THEN 'instagram_feed'
            WHEN platform = 'instagram' AND deliverable_type = 'short_video' THEN 'instagram_reel'
            WHEN platform = 'instagram' AND deliverable_type = 'story' THEN 'instagram_story'
            WHEN platform = 'tiktok' AND deliverable_type = 'live_stream' THEN 'tiktok_live'
            WHEN platform = 'tiktok' AND deliverable_type = 'story' THEN 'tiktok_story'
            WHEN platform = 'tiktok' AND deliverable_type = 'short_video' THEN 'tiktok_video'
            ELSE deliverable_code
        END
        """
    )

    op.execute(
        """
        UPDATE creator_rate_cards
        SET deliverable_code = CASE
            WHEN platform = 'youtube' AND deliverable_type = 'live_stream' THEN 'youtube_live'
            WHEN platform = 'youtube' AND deliverable_type = 'short_video' THEN 'youtube_short'
            WHEN platform = 'youtube' AND deliverable_type IN ('dedicated_video', 'integrated_mention') THEN 'youtube_video'
            WHEN platform = 'instagram' AND deliverable_type = 'live_stream' THEN 'instagram_live'
            WHEN platform = 'instagram' AND deliverable_type = 'photo_post' THEN 'instagram_feed'
            WHEN platform = 'instagram' AND deliverable_type = 'short_video' THEN 'instagram_reel'
            WHEN platform = 'instagram' AND deliverable_type = 'story' THEN 'instagram_story'
            WHEN platform = 'tiktok' AND deliverable_type = 'live_stream' THEN 'tiktok_live'
            WHEN platform = 'tiktok' AND deliverable_type = 'story' THEN 'tiktok_story'
            WHEN platform = 'tiktok' AND deliverable_type = 'short_video' THEN 'tiktok_video'
            ELSE deliverable_code
        END
        """
    )


def downgrade() -> None:
    op.drop_column("creator_rate_cards", "suggested_price_bdt")
    op.drop_column("creator_rate_cards", "deliverable_code")
    op.drop_column("campaign_deliverable_requirements", "deliverable_code")
