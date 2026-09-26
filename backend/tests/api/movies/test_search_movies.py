import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import make_movie

URL = "/api/v1/movies"


def titles(response: httpx.Response) -> list[str]:
    assert response.status_code == 200
    return [item["titulo"] for item in response.json()["items"]]


async def test_searches_title_ignoring_case(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    await make_movie(db_session, titulo="The Matrix Resurrections", ano_lancamento=2021)
    await make_movie(db_session, titulo="A Glitch In The Matrix", ano_lancamento=2021)
    await make_movie(db_session, titulo="Elektro Mathematrix", ano_lancamento=2016)
    await make_movie(db_session, titulo="Blade Runner 2049", ano_lancamento=2017)

    response = await client.get(URL, params={"q": "  mATRIX "})

    assert titles(response) == [
        "A Glitch In The Matrix",
        "Elektro Mathematrix",
        "The Matrix Resurrections",
    ]


async def test_searches_director_name_but_not_cast(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    await make_movie(db_session, titulo="Oppenheimer", diretores=["Christopher Nolan"])
    await make_movie(db_session, titulo="Tenet", diretores=["Christopher Nolan"])
    await make_movie(db_session, titulo="Uncharted", elenco=["Nolan North"])
    await make_movie(db_session, titulo="Interstellar", roteiristas=["Jonathan Nolan"])

    response = await client.get(URL, params={"q": "nolan"})

    assert titles(response) == ["Oppenheimer", "Tenet"]


@pytest.mark.parametrize(
    ("titulo", "diretores", "q"),
    [
        ("Nolan: Bastidores", ["Christopher Nolan"], "nolan"),
        ("Matrix", ["Lana Wachowski", "Lilly Wachowski"], "wachowski"),
    ],
    ids=["title-and-director-match", "two-directors-match"],
)
async def test_movie_matching_several_ways_appears_once(
    client: httpx.AsyncClient,
    db_session: AsyncSession,
    titulo: str,
    diretores: list[str],
    q: str,
) -> None:
    await make_movie(db_session, titulo=titulo, diretores=diretores)

    response = await client.get(URL, params={"q": q})

    assert titles(response) == [titulo]
    assert response.json()["total"] == 1


@pytest.mark.parametrize(
    ("q", "expected"),
    # Sem escape, `e_` também casaria "Filme Comum" (o `_` valeria qualquer caractere).
    [("100%", ["100% Lobo"]), ("e_", ["Filme_Com_Sublinhado"])],
    ids=["percent", "underscore"],
)
async def test_like_wildcards_in_q_are_literal(
    client: httpx.AsyncClient, db_session: AsyncSession, q: str, expected: list[str]
) -> None:
    for titulo in ("100% Lobo", "1000 Dias", "Filme_Com_Sublinhado", "Filme Comum"):
        await make_movie(db_session, titulo=titulo)

    response = await client.get(URL, params={"q": q})

    assert titles(response) == expected


async def test_filters_by_genre_without_duplicates(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    await make_movie(db_session, titulo="Drama e Ação", generos=["Drama", "Action", "Crime"])
    await make_movie(db_session, titulo="Só Drama", generos=["Drama"])
    await make_movie(db_session, titulo="Só Ação", generos=["Action"])

    response = await client.get(URL, params={"genero": "Drama"})

    assert titles(response) == ["Drama e Ação", "Só Drama"]
    assert response.json()["total"] == 2


async def test_filters_by_year(client: httpx.AsyncClient, db_session: AsyncSession) -> None:
    await make_movie(db_session, titulo="De 2019", ano_lancamento=2019)
    await make_movie(db_session, titulo="De 2020", ano_lancamento=2020)
    await make_movie(db_session, titulo="Sem ano")

    response = await client.get(URL, params={"ano": 2020})

    assert titles(response) == ["De 2020"]


async def test_combined_filters_paginate_with_matching_total(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    for number in range(1, 13):
        genero = "Action" if number % 2 else "Drama"
        await make_movie(db_session, titulo=f"Matrix {number:02d}", generos=[genero])
    await make_movie(db_session, titulo="Outro filme", generos=["Action"])

    response = await client.get(
        URL, params={"q": "matrix", "genero": "Action", "page": 2, "page_size": 5}
    )

    assert titles(response) == ["Matrix 11"]
    body = response.json()
    assert (body["total"], body["pages"]) == (6, 2)


async def test_no_match_returns_empty_page(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    await make_movie(
        db_session,
        titulo="The Matrix Resurrections",
        generos=["Science Fiction", "Action", "Adventure"],
    )

    response = await client.get(URL, params={"q": "matrix", "genero": "Drama"})

    assert response.json() == {"items": [], "total": 0, "page": 1, "page_size": 20, "pages": 0}


async def test_accepts_two_character_search(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    await make_movie(db_session, titulo="It Chapter Two")
    await make_movie(db_session, titulo="Joker")

    response = await client.get(URL, params={"q": " it "})

    assert titles(response) == ["It Chapter Two"]


@pytest.mark.parametrize(
    "params",
    [
        {"q": ""},
        {"q": "   "},
        {"q": " a "},
        {"genero": ""},
        {"ano": 1887},
        {"ano": 2101},
        {"ano": 10**20},
    ],
    ids=[
        "q-empty",
        "q-blank",
        "q-one-char",
        "genero-empty",
        "ano-too-old",
        "ano-too-new",
        "ano-overflow",
    ],
)
async def test_rejects_invalid_filters(
    client: httpx.AsyncClient, params: dict[str, object]
) -> None:
    response = await client.get(URL, params=params)

    assert response.status_code == 422
