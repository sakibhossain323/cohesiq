"""add live content metric snapshots

Revision ID: 0021
Revises: 0020
Create Date: 2026-06-08
"""
from typing import Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0021"
down_revision: Union[str, None] = "0020"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "live_content_metric_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("contract_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("platform", sa.String(length=30), nullable=True),
        sa.Column("captured_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("views", sa.Integer(), server_default="0", nullable=False),
        sa.Column("impressions", sa.Integer(), server_default="0", nullable=False),
        sa.Column("likes", sa.Integer(), server_default="0", nullable=False),
        sa.Column("comments", sa.Integer(), server_default="0", nullable=False),
        sa.Column("shares", sa.Integer(), server_default="0", nullable=False),
        sa.Column("saves", sa.Integer(), server_default="0", nullable=False),
        sa.Column("engagement_rate", sa.Float(), server_default="0", nullable=False),
        sa.Column("estimated_revenue_bdt", sa.Integer(), server_default="0", nullable=False),
        sa.Column("revenue_basis", sa.String(length=80), nullable=True),
        sa.Column("source", sa.String(length=30), server_default="manual", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("views >= 0", name="ck_live_metric_views_nonnegative"),
        sa.CheckConstraint("impressions >= 0", name="ck_live_metric_impressions_nonnegative"),
        sa.CheckConstraint("likes >= 0", name="ck_live_metric_likes_nonnegative"),
        sa.CheckConstraint("comments >= 0", name="ck_live_metric_comments_nonnegative"),
        sa.CheckConstraint("shares >= 0", name="ck_live_metric_shares_nonnegative"),
        sa.CheckConstraint("saves >= 0", name="ck_live_metric_saves_nonnegative"),
        sa.ForeignKeyConstraint(["contract_id"], ["contracts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_live_metric_snapshots_contract_time",
        "live_content_metric_snapshots",
        ["contract_id", "captured_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_live_metric_snapshots_contract_time", table_name="live_content_metric_snapshots")
    op.drop_table("live_content_metric_snapshots")
