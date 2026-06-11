import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import settings

# This is the Alembic Config object, which provides access to the .ini file.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import all models so that Base.metadata is populated for --autogenerate
from app.common.models import Base  # noqa: F401
from app.auth.models import User  # noqa: F401
from app.creators.models import (  # noqa: F401
    CreatorProfile, CreatorSocialProfile, CreatorNiche,
    CreatorLanguage, CreatorRateCard, CreatorPortfolioItem,
    CreatorCollaborationHistory,
)
from app.brands.models import BrandProfile  # noqa: F401
from app.campaigns.models import (  # noqa: F401
    Campaign, CampaignNicheTarget, CampaignLanguageTarget,
    CampaignDeliverableRequirement, CampaignApplicationQuestion,
    CampaignAcknowledgment, CampaignApplication, CampaignApplicationAnswer,
    CampaignApplicationAcknowledgment, Review,
    AIMatchScore,
)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = settings.database_url
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' async mode."""
    connectable = create_async_engine(settings.database_url)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
