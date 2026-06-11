"""add pgvector extension and creator embedding column

Revision ID: 0023
Revises: 0022
Create Date: 2026-06-11
"""
from typing import Union

from alembic import op
import sqlalchemy as sa

revision: str = "0023"
down_revision: Union[str, None] = "0022"
branch_labels = None
depends_on = None

# Gemini text-embedding-004 produces 768-dimensional vectors.
EMBEDDING_DIM = 768


def upgrade() -> None:
    # 1. Enable pgvector extension (idempotent)
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # 2. Add embedding column to creator_social_profiles.
    #    The vector type comes from the pgvector extension.
    #    Using raw SQL because SQLAlchemy core doesn't know the pgvector type natively.
    op.execute(
        f"ALTER TABLE creator_social_profiles "
        f"ADD COLUMN IF NOT EXISTS embedding vector({EMBEDDING_DIM})"
    )

    # 3. IVFFlat index for approximate nearest-neighbour cosine search.
    #    lists=100 is a safe default for a corpus of a few thousand creators.
    #    Re-tune with REINDEX when the corpus grows to 10k+.
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_creator_social_profile_embedding "
        "ON creator_social_profiles "
        "USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)"
    )


def downgrade() -> None:
    op.execute(
        "DROP INDEX IF EXISTS idx_creator_social_profile_embedding"
    )
    op.execute(
        "ALTER TABLE creator_social_profiles DROP COLUMN IF EXISTS embedding"
    )
    # We intentionally do NOT drop the vector extension on downgrade —
    # other tables may depend on it in the future.
