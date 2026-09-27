from datetime import datetime

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import make_movie, make_review

URL = "/api/v1/reviews"


async def test_lists_reviews_of_every_movie_newest_first_with_the_movie(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    duna = await make_movie(
        db_session, titulo="Duna", ano_lancamento=2021, url_poster="https://example.com/d.jpg"
    )
    matrix = await make_movie(db_session, titulo="Matrix")
    await make_review(db_session, duna, nome="Ana", nota=9.0, created_at=datetime(2026, 1, 1))
    await make_review(db_session, matrix, nome="Bia", nota=7.5, created_at=datetime(2026, 1, 3))
    await make_review(db_session, duna, nome="Caio", nota=4.0, created_at=datetime(2026, 1, 2))

    response = await client.get(URL)

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 3
    assert [(item["nome"], item["filme"]["titulo"]) for item in body["items"]] == [
        ("Bia", "Matrix"),
        ("Caio", "Duna"),
        ("Ana", "Duna"),
    ]
    assert body["items"][1]["filme"] == {
        "sk_movie_id": duna.sk_movie_id,
        "titulo": "Duna",
        "ano_lancamento": 2021,
        "url_poster": "https://example.com/d.jpg",
    }


async def test_paginates_recent_reviews(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    movie = await make_movie(db_session)
    for day in range(1, 6):
        await make_review(db_session, movie, nome=f"Dia {day}", created_at=datetime(2026, 1, day))

    response = await client.get(URL, params={"page": 2, "page_size": 2})

    body = response.json()
    assert [item["nome"] for item in body["items"]] == ["Dia 3", "Dia 2"]
    assert body["pages"] == 3


async def test_deleted_movie_takes_its_reviews_out_of_the_feed(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    movie = await make_movie(db_session)
    await make_review(db_session, movie)

    await client.delete(f"/api/v1/movies/{movie.sk_movie_id}")
    response = await client.get(URL)

    assert response.json()["total"] == 0
