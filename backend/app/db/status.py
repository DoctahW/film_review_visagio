from enum import StrEnum
from functools import lru_cache
from pathlib import Path

from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import Connection, select
from sqlalchemy.ext.asyncio import AsyncConnection

from app.movies.models import DimMovie

MIGRATIONS_DIR = Path(__file__).resolve().parents[2] / "migrations"


class DatabaseStatus(StrEnum):
    READY = "ready"
    PENDING_MIGRATIONS = "pending_migrations"
    EMPTY = "empty"


STATUS_HINTS: dict[DatabaseStatus, str] = {
    DatabaseStatus.PENDING_MIGRATIONS: (
        "Banco com migrações pendentes: rode `alembic upgrade head` em backend/."
    ),
    DatabaseStatus.EMPTY: (
        "Banco sem filmes: coloque os CSVs em backend/database_csv/ e rode "
        "`python -m app.scripts.seed` em backend/."
    ),
}


@lru_cache
def _expected_heads() -> frozenset[str]:
    return frozenset(ScriptDirectory(str(MIGRATIONS_DIR)).get_heads())


def _is_at_head(connection: Connection) -> bool:
    current = MigrationContext.configure(connection).get_current_heads()
    return frozenset(current) == _expected_heads()


async def check_database(connection: AsyncConnection) -> DatabaseStatus:
    """Confere se o schema está na última migração e se a carga dos CSVs já rodou."""

    if not await connection.run_sync(_is_at_head):
        return DatabaseStatus.PENDING_MIGRATIONS
    if await connection.scalar(select(DimMovie.sk_movie_id).limit(1)) is None:
        return DatabaseStatus.EMPTY
    return DatabaseStatus.READY
