"""add contract model with engagement types and clause fields

Revision ID: 0015
Revises: 0014
Create Date: 2026-06-06

Introduces Contract as a first-class entity that absorbs campaign_type.
campaign_type on campaigns is soft-deprecated (made nullable, default removed).
Do not write new campaign_type values — use contract_type on contracts instead.
See docs/srs-revisions.md §8 for the full deprecation policy.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ENUM

revision: str = "0015"
down_revision: Union[str, None] = "0014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # New enums (created before table so create_type=False works below)
    op.execute("""
        CREATE TYPE contract_type AS ENUM (
            'content_collaboration',
            'product_seeding',
            'talent_engagement'
        )
    """)
    op.execute("""
        CREATE TYPE contract_status AS ENUM (
            'drafted',
            'active',
            'in_production',
            'content_submitted',
            'content_approved',
            'published',
            'closed',
            'disputed'
        )
    """)
    op.execute("""
        CREATE TYPE payment_schedule_type AS ENUM (
            'upfront',
            'on_delivery',
            'milestone'
        )
    """)
    op.execute("""
        CREATE TYPE product_disposition_type AS ENUM (
            'keep',
            'return'
        )
    """)

    op.create_table(
        "contracts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("application_id", UUID(as_uuid=True), sa.ForeignKey("campaign_applications.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("brand_id", UUID(as_uuid=True), sa.ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("creator_id", UUID(as_uuid=True), sa.ForeignKey("creator_profiles.id", ondelete="CASCADE"), nullable=False),
        # Engagement type — replaces campaigns.campaign_type (deprecated)
        sa.Column("contract_type", ENUM("content_collaboration", "product_seeding", "talent_engagement", name="contract_type", create_type=False), nullable=False),
        sa.Column("status", ENUM("drafted", "active", "in_production", "content_submitted", "content_approved", "published", "closed", "disputed", name="contract_status", create_type=False), nullable=False, server_default="active"),
        # Payment clause
        sa.Column("payment_structure", sa.String(20), nullable=False, server_default="none"),
        sa.Column("payment_amount_bdt", sa.Integer(), nullable=True),
        sa.Column("payment_schedule", ENUM("upfront", "on_delivery", "milestone", name="payment_schedule_type", create_type=False), nullable=True),
        # Product transfer clause
        sa.Column("has_product_transfer", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("product_disposition", ENUM("keep", "return", name="product_disposition_type", create_type=False), nullable=True),
        # Deliverable clause
        sa.Column("deliverable_notes", sa.Text(), nullable=True),
        # Exclusivity clause
        sa.Column("exclusivity_days", sa.SmallInteger(), nullable=True),
        sa.Column("usage_rights_days", sa.SmallInteger(), nullable=True),
        # Revision clause
        sa.Column("max_revision_rounds", sa.SmallInteger(), nullable=False, server_default="2"),
        sa.Column("revisions_used", sa.SmallInteger(), nullable=False, server_default="0"),
        # Kill fee clause
        sa.Column("kill_fee_percentage", sa.SmallInteger(), nullable=True),
        # Content submission
        sa.Column("draft_content_url", sa.Text(), nullable=True),
        sa.Column("live_post_url", sa.Text(), nullable=True),
        # Platform fee locked at creation
        sa.Column("platform_fee_percentage", sa.SmallInteger(), nullable=True),
        # Audit trail timestamps
        sa.Column("contracted_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("in_production_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_index("ix_contracts_brand_id", "contracts", ["brand_id"])
    op.create_index("ix_contracts_creator_id", "contracts", ["creator_id"])
    op.create_index("ix_contracts_status", "contracts", ["status"])

    # Soft-deprecate campaigns.campaign_type — do not write new values here
    op.execute("ALTER TABLE campaigns ALTER COLUMN campaign_type DROP NOT NULL")
    op.execute("ALTER TABLE campaigns ALTER COLUMN campaign_type DROP DEFAULT")


def downgrade() -> None:
    op.execute("ALTER TABLE campaigns ALTER COLUMN campaign_type SET NOT NULL")
    op.execute("ALTER TABLE campaigns ALTER COLUMN campaign_type SET DEFAULT 'paid_content'")

    op.drop_index("ix_contracts_status", "contracts")
    op.drop_index("ix_contracts_creator_id", "contracts")
    op.drop_index("ix_contracts_brand_id", "contracts")
    op.drop_table("contracts")

    op.execute("DROP TYPE product_disposition_type")
    op.execute("DROP TYPE payment_schedule_type")
    op.execute("DROP TYPE contract_status")
    op.execute("DROP TYPE contract_type")
