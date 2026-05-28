"""extra composite and partial indexes for browse query performance

Revision ID: 0011
Revises: 0010
Create Date: 2026-05-29
"""

from alembic import op

revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Efficient creator browse: filter by platform + follower range
    op.execute("""
        CREATE INDEX idx_social_niche_followers
        ON creator_social_profiles(platform, follower_count)
        WHERE follower_count IS NOT NULL
    """)

    # Efficient campaign browse: only active campaigns with deadline
    op.execute("""
        CREATE INDEX idx_campaigns_active
        ON campaigns(status, application_deadline)
        WHERE status = 'active'
    """)

    # Efficient creator application history query
    op.execute("""
        CREATE INDEX idx_applications_creator_status
        ON campaign_applications(creator_id, status)
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_applications_creator_status")
    op.execute("DROP INDEX IF EXISTS idx_campaigns_active")
    op.execute("DROP INDEX IF EXISTS idx_social_niche_followers")
