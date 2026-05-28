"""reviews table

Revision ID: 0010
Revises: 0009
Create Date: 2026-05-29
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "reviews",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "application_id",
            UUID(as_uuid=True),
            sa.ForeignKey("campaign_applications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        # Reviewer (one of these is set; the other is NULL)
        sa.Column(
            "reviewer_brand_id",
            UUID(as_uuid=True),
            sa.ForeignKey("brand_profiles.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "reviewer_creator_id",
            UUID(as_uuid=True),
            sa.ForeignKey("creator_profiles.id", ondelete="SET NULL"),
            nullable=True,
        ),
        # Reviewee (one of these is set; the other is NULL)
        sa.Column(
            "reviewee_brand_id",
            UUID(as_uuid=True),
            sa.ForeignKey("brand_profiles.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "reviewee_creator_id",
            UUID(as_uuid=True),
            sa.ForeignKey("creator_profiles.id", ondelete="SET NULL"),
            nullable=True,
        ),
        # Review content
        sa.Column(
            "rating",
            sa.SmallInteger(),
            sa.CheckConstraint("rating BETWEEN 1 AND 5", name="chk_review_rating"),
            nullable=False,
        ),
        sa.Column("review_text", sa.Text(), nullable=True),
        sa.Column("is_public", sa.Boolean(), server_default="true"),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        # Constraints from schema.md
        sa.CheckConstraint(
            "(reviewer_brand_id IS NOT NULL AND reviewer_creator_id IS NULL) OR "
            "(reviewer_brand_id IS NULL AND reviewer_creator_id IS NOT NULL)",
            name="chk_one_reviewer",
        ),
        sa.CheckConstraint(
            "(reviewee_brand_id IS NOT NULL AND reviewee_creator_id IS NULL) OR "
            "(reviewee_brand_id IS NULL AND reviewee_creator_id IS NOT NULL)",
            name="chk_one_reviewee",
        ),
        sa.CheckConstraint(
            "reviewer_brand_id IS DISTINCT FROM reviewee_brand_id OR "
            "reviewer_creator_id IS DISTINCT FROM reviewee_creator_id",
            name="chk_no_self_review",
        ),
        # One review per direction per application
        sa.UniqueConstraint("application_id", "reviewer_brand_id", name="uq_review_brand"),
        sa.UniqueConstraint("application_id", "reviewer_creator_id", name="uq_review_creator"),
    )

    op.create_index("idx_reviews_application", "reviews", ["application_id"])
    op.create_index("idx_reviews_reviewee_creator", "reviews", ["reviewee_creator_id"])
    op.create_index("idx_reviews_reviewee_brand", "reviews", ["reviewee_brand_id"])


def downgrade() -> None:
    op.drop_index("idx_reviews_reviewee_brand", table_name="reviews")
    op.drop_index("idx_reviews_reviewee_creator", table_name="reviews")
    op.drop_index("idx_reviews_application", table_name="reviews")
    op.drop_table("reviews")
