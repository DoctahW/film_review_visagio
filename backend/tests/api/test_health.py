import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import make_movie


async def test_health_is_ok_with_seeded_database(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    await make_movie(db_session)

    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_health_reports_empty_database(client: httpx.AsyncClient) -> None:
    response = await client.get("/health")

    assert response.status_code == 503
    assert "app.scripts.seed" in response.json()["detail"]


async def test_health_reports_pending_migrations(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    await make_movie(db_session)
    await db_session.execute(text("DELETE FROM alembic_version"))
    await db_session.commit()

    response = await client.get("/health")

    assert response.status_code == 503
    assert "alembic upgrade head" in response.json()["detail"]
