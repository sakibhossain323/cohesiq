"""brand_profiles table + add FK from collaboration_history to brand_profiles

Revision ID: 0007
Revises: 0006
Create Date: 2026-05-29
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "brand_profiles",
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
        sa.Column("brand_name", sa.String(120), nullable=False),
        sa.Column("legal_name", sa.String(180), nullable=True),
        sa.Column("logo_url", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("tagline", sa.String(160), nullable=True),
        # Online presence
        sa.Column("website", sa.Text(), nullable=True),
        sa.Column("facebook_page_url", sa.Text(), nullable=True),
        sa.Column("instagram_url", sa.Text(), nullable=True),
        # Business details
        sa.Column(
            "niche_id",
            sa.Integer(),
            sa.ForeignKey("niches.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "company_size",
            sa.String(20),
            sa.CheckConstraint(
                "company_size IN ('individual', 'small', 'medium', 'large')",
                name="chk_brand_company_size",
            ),
            nullable=True,
        ),
        sa.Column("country_code", sa.CHAR(2), server_default="BD"),
        sa.Column("city", sa.String(100), nullable=True),
        # Contact
        sa.Column("contact_name", sa.String(120), nullable=True),
        sa.Column("contact_phone", sa.String(20), nullable=True),
        sa.Column("contact_whatsapp", sa.String(20), nullable=True),
        # Trust signals
        sa.Column("is_verified", sa.Boolean(), server_default="false"),
        sa.Column("verified_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("total_campaigns", sa.Integer(), server_default="0"),
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

    op.create_index("idx_brand_profiles_user", "brand_profiles", ["user_id"])
    op.create_index("idx_brand_profiles_niche", "brand_profiles", ["niche_id"])

    # Now add the FK from collaboration_history.brand_id → brand_profiles.id
    op.create_foreign_key(
        "fk_collab_history_brand",
        "creator_collaboration_history",
        "brand_profiles",
        ["brand_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_collab_history_brand",
        "creator_collaboration_history",
        type_="foreignkey",
    )
    op.drop_index("idx_brand_profiles_niche", table_name="brand_profiles")
    op.drop_index("idx_brand_profiles_user", table_name="brand_profiles")
    op.drop_table("brand_profiles")
