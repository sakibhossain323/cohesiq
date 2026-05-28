"""campaign_applications table

Revision ID: 0009
Revises: 0008
Create Date: 2026-05-29
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ENUM

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "campaign_applications",
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
        sa.Column(
            "creator_id",
            UUID(as_uuid=True),
            sa.ForeignKey("creator_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "initiated_by",
            sa.String(10),
            sa.CheckConstraint(
                "initiated_by IN ('creator', 'brand')",
                name="chk_application_initiated_by",
            ),
            nullable=False,
            server_default="creator",
        ),
        # Creator's pitch
        sa.Column("proposal_text", sa.Text(), nullable=True),
        sa.Column("proposed_rate", sa.Integer(), nullable=True),
        # Brand's response
        sa.Column(
            "status",
            ENUM(
                "pending", "shortlisted", "accepted", "rejected",
                "withdrawn", "completed",
                name="application_status",
                create_type=False,
            ),
            server_default="pending",
            nullable=False,
        ),
        sa.Column("brand_notes", sa.Text(), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        # Agreed terms
        sa.Column("agreed_rate", sa.Integer(), nullable=True),
        sa.Column("agreed_deliverables", sa.Text(), nullable=True),
        # Timestamps
        sa.Column(
            "applied_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column("responded_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("accepted_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("completed_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.UniqueConstraint("campaign_id", "creator_id", name="uq_application_campaign_creator"),
    )

    op.create_index("idx_applications_campaign", "campaign_applications", ["campaign_id"])
    op.create_index("idx_applications_creator", "campaign_applications", ["creator_id"])
    op.create_index("idx_applications_status", "campaign_applications", ["status"])


def downgrade() -> None:
    op.drop_index("idx_applications_status", table_name="campaign_applications")
    op.drop_index("idx_applications_creator", table_name="campaign_applications")
    op.drop_index("idx_applications_campaign", table_name="campaign_applications")
    op.drop_table("campaign_applications")
