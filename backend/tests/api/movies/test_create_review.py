from typing import Any

import httpx
import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.movies.models import DimReview
from tests.factories import make_movie

URL = "/api/v1/movies/{}"
REVIEWS_URL = URL + "/reviews"

VALID: dict[str, Any] = {"nome": "Ana", "nota": 8.5, "comentario": "Ótimo filme."}


async def _rating(client: httpx.AsyncClient, sk_movie_id: str) -> dict[str, Any]:
    return (await client.get(URL.format(sk_movie_id))).json()["avaliacao"]


async def test_two_reviews_create_summary_with_count_and_average(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    # Como os filmes do CSV sem reviews: ainda não há linha em dim_reviews.
    movie = await make_movie(db_session)

    first = await client.post(
        REVIEWS_URL.format(movie.sk_movie_id),
        json={"nome": "  Ana ", "nota": 10, "comentario": " Obra-prima. "},
    )
    second = await client.post(REVIEWS_URL.format(movie.sk_movie_id), json={**VALID, "nota": 6})

    assert (first.status_code, second.status_code) == (201, 201)
    created = first.json()
    assert created == {
        "sk_movie_review_id": created["sk_movie_review_id"],
        "nome": "Ana",
        "nota": 10.0,
        "comentario": "Obra-prima.",
        "created_at": created["created_at"],
    }
    assert await _rating(client, movie.sk_movie_id) == {"qtd_avaliacoes": 2, "media_nota": 8.0}
    listing = (await client.get("/api/v1/movies")).json()["items"]
    assert listing[0]["avaliacao"] == {"qtd_avaliacoes": 2, "media_nota": 8.0}

    history = (await client.get(REVIEWS_URL.format(movie.sk_movie_id))).json()
    by_id = {item["sk_movie_review_id"]: item for item in history["items"]}
    assert by_id == {
        created["sk_movie_review_id"]: created,
        second.json()["sk_movie_review_id"]: second.json(),
    }


async def test_new_review_recalculates_existing_summary(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    movie = await make_movie(db_session, notas=[4.0, 5.0])

    response = await client.post(REVIEWS_URL.format(movie.sk_movie_id), json={**VALID, "nota": 9})

    assert response.status_code == 201
    assert await _rating(client, movie.sk_movie_id) == {"qtd_avaliacoes": 3, "media_nota": 6.0}
    summaries = await db_session.scalar(
        select(func.count())
        .select_from(DimReview)
        .where(DimReview.sk_movie_id == movie.sk_movie_id)
    )
    assert summaries == 1


@pytest.mark.parametrize("nota", [0, 10])
async def test_accepts_boundary_scores(
    client: httpx.AsyncClient, db_session: AsyncSession, nota: float
) -> None:
    movie = await make_movie(db_session)

    response = await client.post(
        REVIEWS_URL.format(movie.sk_movie_id), json={**VALID, "nota": nota}
    )

    assert response.status_code == 201
    assert response.json()["nota"] == nota
    assert await _rating(client, movie.sk_movie_id) == {"qtd_avaliacoes": 1, "media_nota": nota}


@pytest.mark.parametrize(
    "changes",
    [
        {"nota": -0.5},
        {"nota": 10.5},
        {"nota": "dez"},
        {"nome": "   "},
        {"nome": "x" * 121},
        {"comentario": ""},
        {"comentario": "x" * 4001},
    ],
    ids=[
        "nota-negative",
        "nota-above-10",
        "nota-not-number",
        "nome-blank",
        "nome-too-long",
        "comentario-empty",
        "comentario-too-long",
    ],
)
async def test_rejects_invalid_review_without_touching_summary(
    client: httpx.AsyncClient, db_session: AsyncSession, changes: dict[str, Any]
) -> None:
    movie = await make_movie(db_session, notas=[7.0])

    response = await client.post(REVIEWS_URL.format(movie.sk_movie_id), json={**VALID, **changes})

    assert response.status_code == 422
    assert await _rating(client, movie.sk_movie_id) == {"qtd_avaliacoes": 1, "media_nota": 7.0}


@pytest.mark.parametrize("field", ["nome", "nota", "comentario"])
async def test_requires_mandatory_fields(
    client: httpx.AsyncClient, db_session: AsyncSession, field: str
) -> None:
    movie = await make_movie(db_session)
    payload = {key: value for key, value in VALID.items() if key != field}

    response = await client.post(REVIEWS_URL.format(movie.sk_movie_id), json=payload)

    assert response.status_code == 422


async def test_unknown_movie_is_404(client: httpx.AsyncClient) -> None:
    response = await client.post(REVIEWS_URL.format("inexistente"), json=VALID)

    assert response.status_code == 404
    assert response.json() == {"detail": "Filme não encontrado"}
