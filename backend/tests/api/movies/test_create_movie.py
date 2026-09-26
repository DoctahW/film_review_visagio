from typing import Any

import httpx
import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.movies.models import DimGenre, DimPerson
from tests.factories import make_movie

URL = "/api/v1/movies"

VALID: dict[str, Any] = {
    "titulo": "Oppenheimer",
    "diretores": ["Christopher Nolan"],
    "ano_lancamento": 2023,
    "generos": ["History", "Drama"],
}


async def test_creates_movie_visible_in_detail_and_listing(client: httpx.AsyncClient) -> None:
    payload = {
        **VALID,
        "titulo": "  Oppenheimer  ",
        "sinopse": "A história de J. Robert Oppenheimer.",
        "url_poster": "https://exemplo.test/oppenheimer.jpg",
        "duracao_minutos": 180,
    }

    response = await client.post(URL, json=payload)

    assert response.status_code == 201
    created = response.json()
    assert created["id_filme"].startswith("local-")
    assert created == {
        "sk_movie_id": created["sk_movie_id"],
        "id_filme": created["id_filme"],
        "titulo": "Oppenheimer",
        "ano_lancamento": 2023,
        "url_poster": "https://exemplo.test/oppenheimer.jpg",
        "generos": ["Drama", "History"],
        "diretores": ["Christopher Nolan"],
        "avaliacao": {"qtd_avaliacoes": 0, "media_nota": None},
        "sinopse": "A história de J. Robert Oppenheimer.",
        "data_lancamento": None,
        "duracao_minutos": 180,
        "status_filme": None,
        "url_backdrop": None,
        "elenco": [],
        "roteiristas": [],
        "produtoras": [],
        "desempenho": None,
    }

    detail = await client.get(f"{URL}/{created['sk_movie_id']}")
    assert detail.json() == created

    listing = await client.get(URL, params={"q": "oppenheimer"})
    assert [item["sk_movie_id"] for item in listing.json()["items"]] == [created["sk_movie_id"]]


async def test_optional_fields_default_to_null(client: httpx.AsyncClient) -> None:
    response = await client.post(URL, json={**VALID, "sinopse": "   "})

    assert response.status_code == 201
    body = response.json()
    assert (body["sinopse"], body["url_poster"], body["duracao_minutos"]) == (None, None, None)


async def test_reuses_existing_directors_and_genres_ignoring_case(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    await make_movie(db_session, titulo="Tenet", diretores=["Christopher Nolan"], generos=["Drama"])

    response = await client.post(
        URL,
        json={
            **VALID,
            "diretores": ["christopher NOLAN", "Emma Thomas", " emma thomas "],
            "generos": ["drama", " DRAMA ", "Thriller"],
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["diretores"] == ["Christopher Nolan", "Emma Thomas"]
    assert body["generos"] == ["Drama", "Thriller"]
    assert await db_session.scalar(select(func.count()).select_from(DimPerson)) == 2
    assert await db_session.scalar(select(func.count()).select_from(DimGenre)) == 2


async def test_two_movies_with_new_director_share_one_person(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    payload = {**VALID, "diretores": ["Nova Diretora"]}
    first = await client.post(URL, json={**payload, "titulo": "Filme A"})
    second = await client.post(URL, json={**payload, "titulo": "Filme B"})

    assert (first.status_code, second.status_code) == (201, 201)
    assert first.json()["id_filme"] != second.json()["id_filme"]
    directors = (await db_session.scalars(select(DimPerson.nome_pessoa))).all()
    assert directors == ["Nova Diretora"]

    listing = await client.get(URL, params={"q": "nova diretora"})
    assert [item["titulo"] for item in listing.json()["items"]] == ["Filme A", "Filme B"]


@pytest.mark.parametrize(
    "changes",
    [
        {"titulo": ""},
        {"titulo": "   "},
        {"titulo": "x" * 501},
        {"diretores": []},
        {"diretores": ["Christopher Nolan", " "]},
        {"diretores": ["x" * 256]},
        {"diretores": [f"Diretor {index}" for index in range(201)]},
        {"diretores": "Christopher Nolan"},
        {"ano_lancamento": 1500},
        {"ano_lancamento": 2101},
        {"generos": []},
        {"generos": ["Drama", "  "]},
        {"generos": ["x" * 51]},
        {"sinopse": "x" * 4001},
        {"url_poster": "não é url"},
        {"duracao_minutos": 0},
        {"duracao_minutos": 10**20},
    ],
    ids=[
        "titulo-empty",
        "titulo-blank",
        "titulo-too-long",
        "diretores-empty",
        "diretor-blank",
        "diretor-too-long",
        "diretores-too-many",
        "diretores-not-list",
        "ano-1500",
        "ano-2101",
        "generos-empty",
        "genero-blank",
        "genero-too-long",
        "sinopse-too-long",
        "url-invalid",
        "duracao-zero",
        "duracao-overflow",
    ],
)
async def test_rejects_invalid_payload(client: httpx.AsyncClient, changes: dict[str, Any]) -> None:
    response = await client.post(URL, json={**VALID, **changes})

    assert response.status_code == 422
    listing = await client.get(URL)
    assert listing.json()["total"] == 0


@pytest.mark.parametrize("field", ["titulo", "diretores", "ano_lancamento", "generos"])
async def test_requires_mandatory_fields(client: httpx.AsyncClient, field: str) -> None:
    payload = {key: value for key, value in VALID.items() if key != field}

    response = await client.post(URL, json=payload)

    assert response.status_code == 422
