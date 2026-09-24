from collections.abc import AsyncIterator

from sqlalchemy import Engine, event
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

settings = get_settings()


def register_sqlite_foreign_keys(sync_engine: Engine) -> None:
    """Habilita chaves estrangeiras em cada conexão SQLite de um engine síncrono."""

    @event.listens_for(sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_connection: object, connection_record: object) -> None:
        del connection_record
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def enable_sqlite_foreign_keys(async_engine: AsyncEngine) -> None:
    """Habilita chaves estrangeiras em cada conexão SQLite."""

    register_sqlite_foreign_keys(async_engine.sync_engine)


def create_session_factory(async_engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(bind=async_engine, expire_on_commit=False, autoflush=False)


engine = create_async_engine(settings.database_url, echo=settings.environment == "local")
enable_sqlite_foreign_keys(engine)
AsyncSessionLocal = create_session_factory(engine)


async def get_db() -> AsyncIterator[AsyncSession]:
    """Fornece uma sessão assíncrona por requisição."""

    async with AsyncSessionLocal() as session:
        yield session
