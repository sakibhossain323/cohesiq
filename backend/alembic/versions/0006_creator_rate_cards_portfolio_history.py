"""creator rate cards, portfolio items, and collaboration history tables

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-29
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ENUM

revision = "0006"
down_revision = "0005"
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

_collab_type_enum = ENUM(
    "sponsored_post", "product_review", "brand_ambassador",
    "affiliate", "gifted_product", "event_coverage", "other",
    name="collaboration_type",
    create_type=False,
)


def upgrade() -> None:
    # ------------------------------------------------------------------ #
    # creator_rate_cards                                                   #
    # ------------------------------------------------------------------ #
    op.create_table(
        "creator_rate_cards",
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
        sa.Column("platform", _platform_enum, nullable=False),
        sa.Column("deliverable_type", _deliverable_enum, nullable=False),
        sa.Column("price_bdt", sa.Integer(), nullable=False),
        sa.Column("price_usd", sa.Integer(), nullable=True),
        sa.Column("includes", sa.Text(), nullable=True),
        sa.Column("excludes", sa.Text(), nullable=True),
        sa.Column("turnaround_days", sa.SmallInteger(), nullable=True),
        sa.Column("is_negotiable", sa.Boolean(), server_default="true"),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
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
        sa.UniqueConstraint(
            "creator_id", "platform", "deliverable_type",
            name="uq_rate_card_creator_platform_deliverable",
        ),
    )
    op.create_index("idx_rate_cards_creator", "creator_rate_cards", ["creator_id"])

    # ------------------------------------------------------------------ #
    # creator_portfolio_items                                              #
    # ------------------------------------------------------------------ #
    op.create_table(
        "creator_portfolio_items",
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
        sa.Column("platform", _platform_enum, nullable=False),
        sa.Column("content_url", sa.Text(), nullable=False),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("thumbnail_url", sa.Text(), nullable=True),
        sa.Column(
            "niche_id",
            sa.Integer(),
            sa.ForeignKey("niches.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("views", sa.Integer(), nullable=True),
        sa.Column("likes", sa.Integer(), nullable=True),
        sa.Column("comments", sa.Integer(), nullable=True),
        sa.Column("published_at", sa.Date(), nullable=True),
        sa.Column("is_featured", sa.Boolean(), server_default="false"),
        sa.Column("sort_order", sa.Integer(), server_default="0"),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
    )
    op.create_index("idx_portfolio_creator", "creator_portfolio_items", ["creator_id"])

    # ------------------------------------------------------------------ #
    # creator_collaboration_history                                        #
    # ------------------------------------------------------------------ #
    op.create_table(
        "creator_collaboration_history",
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
        # brand_profiles FK added after brand_profiles table exists (migration 0007)
        # stored as nullable UUID; FK constraint added in 0007 downgrade-safe approach
        sa.Column("brand_id", UUID(as_uuid=True), nullable=True),
        sa.Column("brand_name", sa.String(120), nullable=False),
        sa.Column("brand_website", sa.Text(), nullable=True),
        sa.Column(
            "niche_id",
            sa.Integer(),
            sa.ForeignKey("niches.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("platform", _platform_enum, nullable=True),
        sa.Column("collaboration_type", _collab_type_enum, nullable=True),
        sa.Column("collaborated_on", sa.Date(), nullable=True),
        sa.Column("deliverable_description", sa.Text(), nullable=True),
        sa.Column("content_url", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
    )
    op.create_index(
        "idx_collab_history_creator",
        "creator_collaboration_history",
        ["creator_id"],
    )
    op.create_index(
        "idx_collab_history_brand",
        "creator_collaboration_history",
        ["brand_id"],
    )


def downgrade() -> None:
    op.drop_index("idx_collab_history_brand", table_name="creator_collaboration_history")
    op.drop_index("idx_collab_history_creator", table_name="creator_collaboration_history")
    op.drop_table("creator_collaboration_history")
    op.drop_index("idx_portfolio_creator", table_name="creator_portfolio_items")
    op.drop_table("creator_portfolio_items")
    op.drop_index("idx_rate_cards_creator", table_name="creator_rate_cards")
    op.drop_table("creator_rate_cards")
