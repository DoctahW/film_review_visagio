from decimal import Decimal

import httpx
from sqlalchemy import Table, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.movies.models import (
    DimCompany,
    DimGenre,
    DimPerson,
    DimReview,
    FactMoviePerformance,
    MovieReview,
    bridge_movie_company,
    bridge_movie_genre,
    bridge_movie_person,
)
from tests.factories import make_movie

URL = "/api/v1/movies/{}"

MOVIE_TABLES: tuple[Table, ...] = (
    MovieReview.__table__,
    DimReview.__table__,
    FactMoviePerformance.__table__,
    bridge_movie_genre,
    bridge_movie_company,
    bridge_movie_person,
)


async def _rows_of(session: AsyncSession, sk_movie_id: str) -> dict[str, int]:
    return {
        table.name: await session.scalar(
            select(func.count()).select_from(table).where(table.c.sk_movie_id == sk_movie_id)
        )
        or 0
        for table in MOVIE_TABLES
    }


async def test_deletes_movie_with_reviews_and_links_keeping_shared_entities(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    movie = await make_movie(
        db_session,
        titulo="Removido",
        generos=["Drama"],
        diretores=["Diretora"],
        elenco=["Ator"],
        roteiristas=["Roteirista"],
        produtoras=["Estúdio"],
        notas=[7.0, 8.0, 9.0],
        performance=FactMoviePerformance(lucro_usd=Decimal("0.00"), lucro_brl=Decimal("0.00")),
    )
    kept = await make_movie(
        db_session,
        titulo="Mantido",
        generos=["Drama"],
        diretores=["Diretora"],
        produtoras=["Estúdio"],
        notas=[5.0],
    )
    movie_id = movie.sk_movie_id
    assert await _rows_of(db_session, movie_id) == {
        "movie_reviews": 3,
        "dim_reviews": 1,
        "fact_movies_performance": 1,
        "bridge_movie_genre": 1,
        "bridge_movie_company": 1,
        "bridge_movie_person": 3,
    }

    response = await client.delete(URL.format(movie_id))

    assert response.status_code == 204
    assert response.content == b""
    assert (await client.get(URL.format(movie_id))).status_code == 404
    assert (await client.get(URL.format(movie_id) + "/reviews")).status_code == 404
    assert set((await _rows_of(db_session, movie_id)).values()) == {0}

    # Gêneros, pessoas e produtoras são compartilhados e não são apagados.
    for entity, total in ((DimGenre, 1), (DimPerson, 3), (DimCompany, 1)):
        assert await db_session.scalar(select(func.count()).select_from(entity)) == total
    other = (await client.get(URL.format(kept.sk_movie_id))).json()
    assert (other["generos"], other["diretores"], other["produtoras"], other["avaliacao"]) == (
        ["Drama"],
        ["Diretora"],
        ["Estúdio"],
        {"qtd_avaliacoes": 1, "media_nota": 5.0},
    )
    assert (await client.get("/api/v1/movies")).json()["total"] == 1


async def test_unknown_or_already_deleted_movie_is_404(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    movie = await make_movie(db_session)
    first = await client.delete(URL.format(movie.sk_movie_id))

    second = await client.delete(URL.format(movie.sk_movie_id))

    assert first.status_code == 204
    assert second.status_code == 404
    assert second.json() == {"detail": "Filme não encontrado"}
