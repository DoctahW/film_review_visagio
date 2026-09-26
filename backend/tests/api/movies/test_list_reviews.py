from datetime import datetime

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import make_movie, make_review

URL = "/api/v1/movies/{}/reviews"


async def test_lists_only_this_movies_reviews_newest_first(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    movie = await make_movie(db_session, titulo="Avaliado")
    other = await make_movie(db_session, titulo="Outro")
    await make_review(db_session, other, nome="Intruso", created_at=datetime(2026, 1, 4))
    for day, (nome, nota) in enumerate([("Ana", 0.0), ("Bia", 9.5), ("Caio", 10.0)], start=1):
        await make_review(
            db_session, movie, nome=nome, nota=nota, created_at=datetime(2026, 1, day, 12)
        )

    response = await client.get(URL.format(movie.sk_movie_id))

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 3
    assert body["pages"] == 1
    # Nota na escala 0–10, sem conversão (D1).
    assert [(item["nome"], item["nota"], item["created_at"]) for item in body["items"]] == [
        ("Caio", 10.0, "2026-01-03T12:00:00"),
        ("Bia", 9.5, "2026-01-02T12:00:00"),
        ("Ana", 0.0, "2026-01-01T12:00:00"),
    ]


async def test_paginates_reviews(client: httpx.AsyncClient, db_session: AsyncSession) -> None:
    movie = await make_movie(db_session)
    for day in range(1, 6):
        await make_review(db_session, movie, nome=f"Dia {day}", created_at=datetime(2026, 1, day))

    response = await client.get(URL.format(movie.sk_movie_id), params={"page": 2, "page_size": 2})

    body = response.json()
    assert [item["nome"] for item in body["items"]] == ["Dia 3", "Dia 2"]
    assert {key: body[key] for key in ("total", "page", "page_size", "pages")} == {
        "total": 5,
        "page": 2,
        "page_size": 2,
        "pages": 3,
    }


async def test_movie_without_reviews_is_empty_page(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    movie = await make_movie(db_session)

    response = await client.get(URL.format(movie.sk_movie_id))

    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0, "page": 1, "page_size": 20, "pages": 0}


async def test_unknown_movie_is_404(client: httpx.AsyncClient) -> None:
    response = await client.get(URL.format("inexistente"))

    assert response.status_code == 404
    assert response.json() == {"detail": "Filme não encontrado"}
