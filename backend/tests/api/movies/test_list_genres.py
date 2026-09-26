import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.movies.models import DimGenre
from tests.factories import make_movie

URL = "/api/v1/genres"


async def test_lists_genres_alphabetically(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    await make_movie(db_session, titulo="Um", generos=["Western", "Drama"])
    await make_movie(db_session, titulo="Dois", generos=["Drama", "Action"])
    ids = {
        genre.nome_genero: genre.sk_genre_id for genre in await db_session.scalars(select(DimGenre))
    }

    response = await client.get(URL)

    assert response.status_code == 200
    assert response.json() == [
        {"sk_genre_id": ids[nome], "nome_genero": nome} for nome in ("Action", "Drama", "Western")
    ]


async def test_empty_genres(client: httpx.AsyncClient) -> None:
    response = await client.get(URL)

    assert response.status_code == 200
    assert response.json() == []
