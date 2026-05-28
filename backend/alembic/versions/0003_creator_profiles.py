"""creator_profiles table

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-29
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY, ENUM

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "creator_profiles",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        # Identity
        sa.Column("display_name", sa.String(120), nullable=False),
        sa.Column("full_name", sa.String(120), nullable=True),
        sa.Column("profile_photo_url", sa.Text(), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("tagline", sa.String(160), nullable=True),
        # Location
        sa.Column("country_code", sa.CHAR(2), server_default="BD"),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("timezone", sa.String(60), server_default="Asia/Dhaka"),
        # Demographics
        sa.Column(
            "gender",
            ENUM(
                "male", "female", "non_binary", "prefer_not_to_say",
                name="gender_type",
                create_type=False,
            ),
            nullable=True,
        ),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        # Collaboration settings
        sa.Column("is_available", sa.Boolean(), server_default="true"),
        sa.Column("min_budget", sa.Integer(), nullable=True),
        sa.Column("response_time_hours", sa.Integer(), server_default="48"),
        sa.Column(
            "preferred_collaboration_types",
            ARRAY(
                ENUM(
                    "sponsored_post", "product_review", "brand_ambassador",
                    "affiliate", "gifted_product", "event_coverage", "other",
                    name="collaboration_type",
                    create_type=False,
                )
            ),
            server_default="{}",
        ),
        # Contact
        sa.Column("contact_whatsapp", sa.String(20), nullable=True),
        sa.Column("contact_email", sa.String(255), nullable=True),
        # Verification
        sa.Column("is_identity_verified", sa.Boolean(), server_default="false"),
        sa.Column("verified_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("total_collaborations", sa.Integer(), server_default="0"),
        sa.Column("average_rating", sa.Numeric(3, 2), nullable=True),
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
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )

    op.create_index("idx_creator_profiles_user", "creator_profiles", ["user_id"])
    op.create_index("idx_creator_profiles_city", "creator_profiles", ["city"])
    op.create_index("idx_creator_profiles_avail", "creator_profiles", ["is_available"])
    op.create_index("idx_creator_profiles_country", "creator_profiles", ["country_code"])


def downgrade() -> None:
    op.drop_index("idx_creator_profiles_country", table_name="creator_profiles")
    op.drop_index("idx_creator_profiles_avail", table_name="creator_profiles")
    op.drop_index("idx_creator_profiles_city", table_name="creator_profiles")
    op.drop_index("idx_creator_profiles_user", table_name="creator_profiles")
    op.drop_table("creator_profiles")
