"""Add clerk_id to users and make password_hash nullable

Revision ID: 0012
Revises: 0011
Create Date: 2026-05-30
"""

from alembic import op
import sqlalchemy as sa

revision = "0012"
down_revision = "0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add clerk_id column — nullable so existing seeded rows are unaffected
    op.add_column(
        "users",
        sa.Column("clerk_id", sa.String(255), nullable=True, unique=True),
    )
    op.create_index("idx_users_clerk_id", "users", ["clerk_id"])

    # Make password_hash nullable — Clerk-authenticated users have no local password
    op.alter_column("users", "password_hash", nullable=True)


def downgrade() -> None:
    op.alter_column("users", "password_hash", nullable=False)
    op.drop_index("idx_users_clerk_id", table_name="users")
    op.drop_column("users", "clerk_id")
