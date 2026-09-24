import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from tests.factories import make_movie

URL = "/api/v1/movies"


async def test_paginates_catalog_ordered_by_title(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    for number in range(25, 0, -1):
        await make_movie(db_session, titulo=f"Filme {number:02d}")

    response = await client.get(URL, params={"page": 2, "page_size": 10})

    assert response.status_code == 200
    body = response.json()
    assert [item["titulo"] for item in body["items"]] == [f"Filme {n}" for n in range(11, 21)]
    assert {key: body[key] for key in ("total", "page", "page_size", "pages")} == {
        "total": 25,
        "page": 2,
        "page_size": 10,
        "pages": 3,
    }


@pytest.mark.parametrize("page", [4, 10**18])
async def test_page_past_the_end_is_empty(
    client: httpx.AsyncClient, db_session: AsyncSession, page: int
) -> None:
    for number in range(25):
        await make_movie(db_session, titulo=f"Filme {number:02d}")

    response = await client.get(URL, params={"page": page, "page_size": 10})

    assert response.status_code == 200
    body = response.json()
    assert body["items"] == []
    assert body["total"] == 25
    assert body["pages"] == 3


async def test_empty_catalog(client: httpx.AsyncClient) -> None:
    response = await client.get(URL)

    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0, "page": 1, "page_size": 20, "pages": 0}


async def test_item_exposes_genres_directors_and_rating(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    rated = await make_movie(
        db_session,
        titulo="A Origem",
        ano_lancamento=2010,
        url_poster="https://exemplo.test/origem.jpg",
        generos=["Ficção científica", "Ação"],
        diretores=["Christopher Nolan"],
        elenco=["Leonardo DiCaprio"],
        notas=[7.0, 8.0, 8.0],
    )
    unrated = await make_movie(db_session, titulo="B Sem Avaliações", generos=["Ação"])

    response = await client.get(URL)

    assert response.json()["items"] == [
        {
            "sk_movie_id": rated.sk_movie_id,
            "titulo": "A Origem",
            "ano_lancamento": 2010,
            "url_poster": "https://exemplo.test/origem.jpg",
            "generos": ["Ação", "Ficção científica"],
            "diretores": ["Christopher Nolan"],
            "avaliacao": {"qtd_avaliacoes": 3, "media_nota": 7.7},
        },
        {
            "sk_movie_id": unrated.sk_movie_id,
            "titulo": "B Sem Avaliações",
            "ano_lancamento": None,
            "url_poster": None,
            "generos": ["Ação"],
            "diretores": [],
            "avaliacao": {"qtd_avaliacoes": 0, "media_nota": None},
        },
    ]


@pytest.mark.parametrize(
    "params",
    [{"page": 0}, {"page_size": 0}, {"page_size": 101}],
    ids=["page=0", "page_size=0", "page_size=101"],
)
async def test_rejects_out_of_range_pagination(
    client: httpx.AsyncClient, params: dict[str, int]
) -> None:
    response = await client.get(URL, params=params)

    assert response.status_code == 422
