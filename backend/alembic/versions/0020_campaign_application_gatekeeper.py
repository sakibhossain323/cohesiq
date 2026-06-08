"""add campaign application gatekeeper workflow

Revision ID: 0020
Revises: 0019
Create Date: 2026-06-08
"""
from typing import Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0020"
down_revision: Union[str, None] = "0019"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'pending_agreement'")

    op.create_table(
        "campaign_application_questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("question_type", sa.String(length=20), server_default="text", nullable=False),
        sa.Column("options_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("is_required", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("sort_order", sa.SmallInteger(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("question_type IN ('text', 'single_choice', 'multi_choice')", name="ck_campaign_question_type"),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_campaign_application_questions_campaign",
        "campaign_application_questions",
        ["campaign_id"],
        unique=False,
    )

    op.create_table(
        "campaign_acknowledgments",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("campaign_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("statement_text", sa.Text(), nullable=False),
        sa.Column("is_required", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("sort_order", sa.SmallInteger(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_campaign_acknowledgments_campaign",
        "campaign_acknowledgments",
        ["campaign_id"],
        unique=False,
    )

    op.create_table(
        "campaign_application_answers",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("application_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("answer_text", sa.Text(), nullable=True),
        sa.Column("answer_options_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["campaign_applications.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["question_id"], ["campaign_application_questions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("application_id", "question_id", name="uq_application_answer_question"),
    )
    op.create_index(
        "idx_campaign_application_answers_application",
        "campaign_application_answers",
        ["application_id"],
        unique=False,
    )

    op.create_table(
        "campaign_application_acknowledgments",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("application_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("acknowledgment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["acknowledgment_id"], ["campaign_acknowledgments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["application_id"], ["campaign_applications.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("application_id", "acknowledgment_id", name="uq_application_acknowledgment"),
    )
    op.create_index(
        "idx_campaign_application_acknowledgments_application",
        "campaign_application_acknowledgments",
        ["application_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_campaign_application_acknowledgments_application", table_name="campaign_application_acknowledgments")
    op.drop_table("campaign_application_acknowledgments")
    op.drop_index("idx_campaign_application_answers_application", table_name="campaign_application_answers")
    op.drop_table("campaign_application_answers")
    op.drop_index("idx_campaign_acknowledgments_campaign", table_name="campaign_acknowledgments")
    op.drop_table("campaign_acknowledgments")
    op.drop_index("idx_campaign_application_questions_campaign", table_name="campaign_application_questions")
    op.drop_table("campaign_application_questions")
