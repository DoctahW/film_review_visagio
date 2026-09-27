from datetime import date, timedelta

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.movies.models import FactMoviePerformance
from tests.factories import make_movie

URL = "/api/v1/movies"
NEW_RELEASES = {"sort": "lancamento", "order": "desc", "lancados": True, "min_votos": 100}


def _performance(votos: int | None) -> FactMoviePerformance:
    return FactMoviePerformance(qtd_tmdb=votos)


async def test_new_releases_are_released_known_movies_newest_first(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    today = date.today()
    await make_movie(
        db_session,
        titulo="Anunciado",
        data_lancamento=today + timedelta(days=30),
        performance=_performance(5000),
    )
    await make_movie(
        db_session,
        titulo="Obscuro",
        data_lancamento=today - timedelta(days=1),
        performance=_performance(12),
    )
    await make_movie(db_session, titulo="Sem desempenho", data_lancamento=today)
    await make_movie(db_session, titulo="Sem data", performance=_performance(900))
    await make_movie(
        db_session,
        titulo="Mais antigo",
        data_lancamento=today - timedelta(days=90),
        performance=_performance(100),
    )
    await make_movie(
        db_session,
        titulo="Recente",
        data_lancamento=today - timedelta(days=3),
        performance=_performance(800),
    )

    response = await client.get(URL, params=NEW_RELEASES)

    assert response.status_code == 200
    body = response.json()
    assert [item["titulo"] for item in body["items"]] == ["Recente", "Mais antigo"]
    assert body["total"] == 2


async def test_sort_by_release_date_puts_missing_dates_last(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    await make_movie(db_session, titulo="Sem data")
    await make_movie(db_session, titulo="2019", data_lancamento=date(2019, 5, 1))
    await make_movie(db_session, titulo="2021", data_lancamento=date(2021, 5, 1))

    response = await client.get(URL, params={"sort": "lancamento", "order": "asc"})

    assert [item["titulo"] for item in response.json()["items"]] == ["2019", "2021", "Sem data"]


async def test_rejects_negative_min_votes(client: httpx.AsyncClient) -> None:
    response = await client.get(URL, params={"min_votos": -1})

    assert response.status_code == 422
