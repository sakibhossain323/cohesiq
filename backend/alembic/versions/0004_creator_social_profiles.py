"""creator_social_profiles table

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-29
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY, ENUM

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "creator_social_profiles",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "creator_id",
            UUID(as_uuid=True),
            sa.ForeignKey("creator_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "platform",
            ENUM(
                "youtube", "instagram", "facebook", "tiktok",
                "twitter_x", "linkedin", "snapchat", "other",
                name="platform_type",
                create_type=False,
            ),
            nullable=False,
        ),
        # Identity on platform
        sa.Column("handle", sa.String(255), nullable=False),
        sa.Column("profile_url", sa.Text(), nullable=False),
        sa.Column("platform_user_id", sa.String(255), nullable=True),
        sa.Column("display_name_on_platform", sa.String(120), nullable=True),
        # Audience size
        sa.Column("follower_count", sa.Integer(), nullable=True),
        sa.Column("following_count", sa.Integer(), nullable=True),
        # Engagement
        sa.Column("avg_views_per_post", sa.Integer(), nullable=True),
        sa.Column("avg_likes_per_post", sa.Integer(), nullable=True),
        sa.Column("avg_comments_per_post", sa.Integer(), nullable=True),
        sa.Column("avg_shares_per_post", sa.Integer(), nullable=True),
        sa.Column("engagement_rate", sa.Numeric(5, 4), nullable=True),
        # Content behaviour
        sa.Column("posts_per_month", sa.Numeric(5, 1), nullable=True),
        sa.Column("is_primary_platform", sa.Boolean(), server_default="false"),
        sa.Column("account_created_year", sa.SmallInteger(), nullable=True),
        sa.Column("is_monetized", sa.Boolean(), server_default="false"),
        sa.Column("has_verified_badge", sa.Boolean(), server_default="false"),
        # Audience demographics
        sa.Column("audience_country_primary", sa.CHAR(2), server_default="BD"),
        sa.Column("audience_city_primary", sa.String(100), nullable=True),
        sa.Column("audience_age_range_min", sa.SmallInteger(), nullable=True),
        sa.Column("audience_age_range_max", sa.SmallInteger(), nullable=True),
        sa.Column(
            "audience_gender_majority",
            ENUM(
                "male", "female", "non_binary", "prefer_not_to_say",
                name="gender_type",
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column("audience_gender_pct", sa.SmallInteger(), nullable=True),
        # Content language
        sa.Column(
            "content_languages",
            ARRAY(sa.CHAR(2)),
            server_default="{bn}",
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "stats_reported_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
        ),
        sa.Column("stats_reported_for_period", sa.String(30), nullable=True),
        # Timestamps
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.UniqueConstraint("creator_id", "platform", name="uq_social_creator_platform"),
    )

    op.create_index("idx_social_profiles_creator", "creator_social_profiles", ["creator_id"])
    op.create_index("idx_social_profiles_platform", "creator_social_profiles", ["platform"])
    op.create_index("idx_social_profiles_followers", "creator_social_profiles", ["follower_count"])
    op.create_index("idx_social_profiles_engagement", "creator_social_profiles", ["engagement_rate"])


def downgrade() -> None:
    op.drop_index("idx_social_profiles_engagement", table_name="creator_social_profiles")
    op.drop_index("idx_social_profiles_followers", table_name="creator_social_profiles")
    op.drop_index("idx_social_profiles_platform", table_name="creator_social_profiles")
    op.drop_index("idx_social_profiles_creator", table_name="creator_social_profiles")
    op.drop_table("creator_social_profiles")
