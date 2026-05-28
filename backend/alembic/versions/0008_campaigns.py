"""campaigns and campaign target tables

Revision ID: 0008
Revises: 0007
Create Date: 2026-05-29
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY, ENUM

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None

_platform_enum = ENUM(
    "youtube", "instagram", "facebook", "tiktok",
    "twitter_x", "linkedin", "snapchat", "other",
    name="platform_type",
    create_type=False,
)

_deliverable_enum = ENUM(
    "dedicated_video", "integrated_mention", "short_video",
    "photo_post", "story", "live_stream", "blog_post", "other",
    name="deliverable_type",
    create_type=False,
)

_gender_enum = ENUM(
    "male", "female", "non_binary", "prefer_not_to_say",
    name="gender_type",
    create_type=False,
)


def upgrade() -> None:
    # ------------------------------------------------------------------ #
    # campaigns                                                            #
    # ------------------------------------------------------------------ #
    op.create_table(
        "campaigns",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "brand_id",
            UUID(as_uuid=True),
            sa.ForeignKey("brand_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        # Basic info
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("objectives", sa.Text(), nullable=True),
        # Targeting: niche
        sa.Column(
            "primary_niche_id",
            sa.Integer(),
            sa.ForeignKey("niches.id", ondelete="SET NULL"),
            nullable=True,
        ),
        # Targeting: platform (array)
        sa.Column(
            "required_platforms",
            ARRAY(_platform_enum),
            server_default="{youtube}",
        ),
        # Targeting: budget
        sa.Column("budget_per_creator_min", sa.Integer(), nullable=True),
        sa.Column("budget_per_creator_max", sa.Integer(), nullable=False),
        # Targeting: audience size
        sa.Column("creator_min_followers", sa.Integer(), server_default="1000"),
        sa.Column("creator_max_followers", sa.Integer(), nullable=True),
        # Targeting: location
        sa.Column(
            "target_countries",
            ARRAY(sa.CHAR(2)),
            server_default="{BD}",
        ),
        sa.Column("target_cities", ARRAY(sa.Text()), server_default="{}"),
        # Targeting: demographics
        sa.Column("target_age_min", sa.SmallInteger(), nullable=True),
        sa.Column("target_age_max", sa.SmallInteger(), nullable=True),
        sa.Column("target_gender", _gender_enum, nullable=True),
        # Deliverables
        sa.Column("deliverables_description", sa.Text(), nullable=True),
        sa.Column("number_of_creators", sa.Integer(), server_default="1"),
        # Timeline
        sa.Column("application_deadline", sa.Date(), nullable=True),
        sa.Column("content_deadline", sa.Date(), nullable=True),
        # Status
        sa.Column(
            "status",
            ENUM(
                "draft", "active", "in_progress", "completed", "cancelled",
                name="campaign_status",
                create_type=False,
            ),
            server_default="draft",
            nullable=False,
        ),
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
    )

    op.create_index("idx_campaigns_brand", "campaigns", ["brand_id"])
    op.create_index("idx_campaigns_status", "campaigns", ["status"])
    op.create_index("idx_campaigns_primary_niche", "campaigns", ["primary_niche_id"])
    op.create_index("idx_campaigns_budget", "campaigns", ["budget_per_creator_max"])

    # ------------------------------------------------------------------ #
    # campaign_niche_targets                                               #
    # ------------------------------------------------------------------ #
    op.create_table(
        "campaign_niche_targets",
        sa.Column(
            "campaign_id",
            UUID(as_uuid=True),
            sa.ForeignKey("campaigns.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "niche_id",
            sa.Integer(),
            sa.ForeignKey("niches.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("campaign_id", "niche_id"),
    )

    # ------------------------------------------------------------------ #
    # campaign_language_targets                                            #
    # ------------------------------------------------------------------ #
    op.create_table(
        "campaign_language_targets",
        sa.Column(
            "campaign_id",
            UUID(as_uuid=True),
            sa.ForeignKey("campaigns.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "language_code",
            sa.CHAR(2),
            sa.ForeignKey("languages.code", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("is_required", sa.Boolean(), server_default="true"),
        sa.PrimaryKeyConstraint("campaign_id", "language_code"),
    )

    # ------------------------------------------------------------------ #
    # campaign_deliverable_requirements                                    #
    # ------------------------------------------------------------------ #
    op.create_table(
        "campaign_deliverable_requirements",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "campaign_id",
            UUID(as_uuid=True),
            sa.ForeignKey("campaigns.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("platform", _platform_enum, nullable=False),
        sa.Column("deliverable_type", _deliverable_enum, nullable=False),
        sa.Column("quantity", sa.SmallInteger(), server_default="1"),
        sa.Column("notes", sa.Text(), nullable=True),
    )
    op.create_index(
        "idx_deliverable_req_campaign",
        "campaign_deliverable_requirements",
        ["campaign_id"],
    )


def downgrade() -> None:
    op.drop_index("idx_deliverable_req_campaign", table_name="campaign_deliverable_requirements")
    op.drop_table("campaign_deliverable_requirements")
    op.drop_table("campaign_language_targets")
    op.drop_table("campaign_niche_targets")
    op.drop_index("idx_campaigns_budget", table_name="campaigns")
    op.drop_index("idx_campaigns_primary_niche", table_name="campaigns")
    op.drop_index("idx_campaigns_status", table_name="campaigns")
    op.drop_index("idx_campaigns_brand", table_name="campaigns")
    op.drop_table("campaigns")
