"""add platform recency semantic to ai_match_scores

Revision ID: 0014
Revises: 0013_campaign_type_kpis
Create Date: 2026-06-05
"""
from typing import Union
from alembic import op
import sqlalchemy as sa

revision: str = "0014"
down_revision: Union[str, None] = "0013_campaign_type_kpis"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("ai_match_scores", sa.Column("score_platform", sa.Float(), nullable=True))
    op.add_column("ai_match_scores", sa.Column("score_recency", sa.Float(), nullable=True))
    op.add_column("ai_match_scores", sa.Column("score_semantic", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("ai_match_scores", "score_semantic")
    op.drop_column("ai_match_scores", "score_recency")
    op.drop_column("ai_match_scores", "score_platform")
