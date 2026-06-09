"""offer flow: contract deliverables, negotiation turns, non-cash compensation

Revision ID: 0022
Revises: 0021
Create Date: 2026-06-10
"""
from typing import Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0022"
down_revision: Union[str, None] = "0021"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Non-cash compensation clause on contracts
    op.add_column(
        "contracts",
        sa.Column("non_cash_compensation", sa.Text(), nullable=True),
    )

    # Per-creator subset of campaign deliverables, chosen at offer time
    op.create_table(
        "contract_deliverables",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("contract_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("requirement_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.SmallInteger(), server_default="1", nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["contract_id"], ["contracts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["requirement_id"], ["campaign_deliverable_requirements.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("contract_id", "requirement_id", name="uq_contract_deliverable"),
    )

    # Multi-turn offer / counter-offer thread per application
    op.create_table(
        "negotiation_turns",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("application_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("author_role", sa.String(length=10), nullable=False),
        sa.Column("status", sa.String(length=12), server_default="proposed", nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("proposed_rate", sa.Integer(), nullable=True),
        sa.Column("proposed_terms", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("author_role IN ('brand', 'creator')", name="ck_negotiation_author_role"),
        sa.ForeignKeyConstraint(["application_id"], ["campaign_applications.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_negotiation_turns_application_time",
        "negotiation_turns",
        ["application_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_negotiation_turns_application_time", table_name="negotiation_turns")
    op.drop_table("negotiation_turns")
    op.drop_table("contract_deliverables")
    op.drop_column("contracts", "non_cash_compensation")
