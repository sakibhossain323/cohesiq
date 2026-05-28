"""enums and lookup tables

Revision ID: 0001
Revises:
Create Date: 2026-05-29

Creates:
  - 7 PostgreSQL native enum types
  - niches table (seeded with 14 rows)
  - languages table (seeded with 5 rows)
"""

from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------ #
    # 1. Enum types                                                        #
    # ------------------------------------------------------------------ #
    op.execute("""
        CREATE TYPE platform_type AS ENUM (
            'youtube', 'instagram', 'facebook', 'tiktok',
            'twitter_x', 'linkedin', 'snapchat', 'other'
        )
    """)
    op.execute("""
        CREATE TYPE user_role AS ENUM (
            'creator', 'brand', 'admin'
        )
    """)
    op.execute("""
        CREATE TYPE campaign_status AS ENUM (
            'draft', 'active', 'in_progress', 'completed', 'cancelled'
        )
    """)
    op.execute("""
        CREATE TYPE application_status AS ENUM (
            'pending', 'shortlisted', 'accepted', 'rejected',
            'withdrawn', 'completed'
        )
    """)
    op.execute("""
        CREATE TYPE deliverable_type AS ENUM (
            'dedicated_video', 'integrated_mention', 'short_video',
            'photo_post', 'story', 'live_stream', 'blog_post', 'other'
        )
    """)
    op.execute("""
        CREATE TYPE collaboration_type AS ENUM (
            'sponsored_post', 'product_review', 'brand_ambassador',
            'affiliate', 'gifted_product', 'event_coverage', 'other'
        )
    """)
    op.execute("""
        CREATE TYPE gender_type AS ENUM (
            'male', 'female', 'non_binary', 'prefer_not_to_say'
        )
    """)

    # ------------------------------------------------------------------ #
    # 2. niches lookup table                                               #
    # ------------------------------------------------------------------ #
    op.create_table(
        "niches",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(80), nullable=False, unique=True),
        sa.Column("slug", sa.String(80), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "parent_id",
            sa.Integer(),
            sa.ForeignKey("niches.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("sort_order", sa.Integer(), server_default="0"),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("NOW()"),
        ),
    )

    # Seed niches
    op.execute("""
        INSERT INTO niches (name, slug, sort_order) VALUES
            ('Technology',    'technology',    1),
            ('Gaming',        'gaming',        2),
            ('Fashion',       'fashion',       3),
            ('Beauty',        'beauty',        4),
            ('Food',          'food',          5),
            ('Travel',        'travel',        6),
            ('Lifestyle',     'lifestyle',     7),
            ('Education',     'education',     8),
            ('Finance',       'finance',       9),
            ('Fitness',       'fitness',       10),
            ('Parenting',     'parenting',     11),
            ('Entertainment', 'entertainment', 12),
            ('News',          'news',          13),
            ('Other',         'other',         14)
    """)

    # ------------------------------------------------------------------ #
    # 3. languages lookup table                                            #
    # ------------------------------------------------------------------ #
    op.create_table(
        "languages",
        sa.Column("code", sa.CHAR(2), primary_key=True),
        sa.Column("name", sa.String(60), nullable=False),
        sa.Column("native_name", sa.String(60), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
    )

    # Seed languages
    op.execute("""
        INSERT INTO languages (code, name, native_name) VALUES
            ('bn', 'Bengali', 'বাংলা'),
            ('en', 'English', 'English'),
            ('ar', 'Arabic',  'العربية'),
            ('hi', 'Hindi',   'हिन्दी'),
            ('ur', 'Urdu',    'اردو')
    """)


def downgrade() -> None:
    op.drop_table("languages")
    op.drop_table("niches")

    op.execute("DROP TYPE IF EXISTS gender_type")
    op.execute("DROP TYPE IF EXISTS collaboration_type")
    op.execute("DROP TYPE IF EXISTS deliverable_type")
    op.execute("DROP TYPE IF EXISTS application_status")
    op.execute("DROP TYPE IF EXISTS campaign_status")
    op.execute("DROP TYPE IF EXISTS user_role")
    op.execute("DROP TYPE IF EXISTS platform_type")
