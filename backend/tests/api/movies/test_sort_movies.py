import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import make_movie

URL = "/api/v1/movies"


async def sorted_titles(client: httpx.AsyncClient, sort: str, order: str) -> list[str]:
    response = await client.get(URL, params={"sort": sort, "order": order})
    assert response.status_code == 200
    return [item["titulo"] for item in response.json()["items"]]


async def test_sorts_by_title_descending(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    for titulo in ("B", "C", "A"):
        await make_movie(db_session, titulo=titulo)

    assert await sorted_titles(client, "titulo", "desc") == ["C", "B", "A"]


@pytest.mark.parametrize(
    ("order", "expected"),
    [
        ("asc", ["De 2018", "A de 2020", "B de 2020", "Sem ano"]),
        ("desc", ["A de 2020", "B de 2020", "De 2018", "Sem ano"]),
    ],
)
async def test_sorts_by_year_with_missing_year_last(
    client: httpx.AsyncClient, db_session: AsyncSession, order: str, expected: list[str]
) -> None:
    await make_movie(db_session, titulo="Sem ano")
    await make_movie(db_session, titulo="B de 2020", ano_lancamento=2020)
    await make_movie(db_session, titulo="De 2018", ano_lancamento=2018)
    await make_movie(db_session, titulo="A de 2020", ano_lancamento=2020)

    assert await sorted_titles(client, "ano", order) == expected


@pytest.mark.parametrize(
    ("order", "expected"),
    [
        ("asc", ["Média 4", "A média 9", "B média 9", "Sem avaliações"]),
        ("desc", ["A média 9", "B média 9", "Média 4", "Sem avaliações"]),
    ],
)
async def test_sorts_by_rating_with_unrated_last(
    client: httpx.AsyncClient, db_session: AsyncSession, order: str, expected: list[str]
) -> None:
    await make_movie(db_session, titulo="Sem avaliações")
    await make_movie(db_session, titulo="B média 9", notas=[8.0, 10.0])
    await make_movie(db_session, titulo="Média 4", notas=[4.0])
    await make_movie(db_session, titulo="A média 9", notas=[9.0])

    assert await sorted_titles(client, "media", order) == expected


async def test_sort_by_rating_combines_with_filters_and_total(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    await make_movie(db_session, titulo="Matrix", generos=["Action"], notas=[6.0])
    await make_movie(db_session, titulo="Matrix Reloaded", generos=["Action"], notas=[9.0])
    await make_movie(db_session, titulo="Matrix Sem Nota", generos=["Action"])
    await make_movie(db_session, titulo="Outro", generos=["Action"], notas=[10.0])

    response = await client.get(
        URL, params={"q": "matrix", "genero": "Action", "sort": "media", "order": "desc"}
    )

    body = response.json()
    assert [item["titulo"] for item in body["items"]] == [
        "Matrix Reloaded",
        "Matrix",
        "Matrix Sem Nota",
    ]
    assert body["total"] == 3


@pytest.mark.parametrize("params", [{"sort": "nota"}, {"order": "up"}], ids=["sort", "order"])
async def test_rejects_unknown_sort(client: httpx.AsyncClient, params: dict[str, str]) -> None:
    response = await client.get(URL, params=params)

    assert response.status_code == 422
