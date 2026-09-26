from datetime import date
from decimal import Decimal

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.movies.models import FactMoviePerformance
from tests.factories import make_movie

URL = "/api/v1/movies/{}"


async def test_detail_exposes_full_contract(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    movie = await make_movie(
        db_session,
        titulo="A Origem",
        id_filme="tt1375666",
        sinopse="Um ladrão invade sonhos.",
        data_lancamento=date(2010, 7, 16),
        ano_lancamento=2010,
        duracao_minutos=148,
        status_filme="Released",
        url_poster="https://exemplo.test/poster.jpg",
        url_backdrop="https://exemplo.test/backdrop.jpg",
        generos=["Ficção científica", "Ação"],
        diretores=["Christopher Nolan"],
        elenco=["Tom Hardy", "Leonardo DiCaprio"],
        roteiristas=["Christopher Nolan"],
        produtoras=["Warner Bros.", "Legendary"],
        notas=[7.0, 8.0, 8.0],
        performance=FactMoviePerformance(
            orcamento_usd=Decimal("160000000.00"),
            receita_usd=Decimal("825532764.00"),
            lucro_usd=Decimal("665532764.00"),
            lucro_brl=Decimal("0.00"),
            popularidade=83.95,
            nota_tmdb=8.4,
            qtd_tmdb=35000,
            nota_imdb=8.8,
            qtd_imdb=2400000,
        ),
    )

    response = await client.get(URL.format(movie.sk_movie_id))

    assert response.status_code == 200
    assert response.json() == {
        "sk_movie_id": movie.sk_movie_id,
        "id_filme": "tt1375666",
        "titulo": "A Origem",
        "sinopse": "Um ladrão invade sonhos.",
        "data_lancamento": "2010-07-16",
        "ano_lancamento": 2010,
        "duracao_minutos": 148,
        "status_filme": "Released",
        "url_poster": "https://exemplo.test/poster.jpg",
        "url_backdrop": "https://exemplo.test/backdrop.jpg",
        "generos": ["Ação", "Ficção científica"],
        # O mesmo nome como diretor e roteirista são pessoas distintas (nome + tipo).
        "diretores": ["Christopher Nolan"],
        "elenco": ["Leonardo DiCaprio", "Tom Hardy"],
        "roteiristas": ["Christopher Nolan"],
        "produtoras": ["Legendary", "Warner Bros."],
        "avaliacao": {"qtd_avaliacoes": 3, "media_nota": 7.7},
        "desempenho": {
            "orcamento_usd": 160000000.0,
            "receita_usd": 825532764.0,
            "lucro_usd": 665532764.0,
            "orcamento_brl": None,
            "receita_brl": None,
            "lucro_brl": 0.0,
            "popularidade": 83.95,
            "nota_tmdb": 8.4,
            "qtd_tmdb": 35000,
            "nota_imdb": 8.8,
            "qtd_imdb": 2400000,
        },
    }


async def test_detail_of_bare_movie_has_empty_relations(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    movie = await make_movie(db_session, titulo="Sem Nada")

    response = await client.get(URL.format(movie.sk_movie_id))

    assert response.status_code == 200
    body = response.json()
    assert body["avaliacao"] == {"qtd_avaliacoes": 0, "media_nota": None}
    assert body["desempenho"] is None
    assert [
        body[key] for key in ("generos", "diretores", "elenco", "roteiristas", "produtoras")
    ] == [
        [],
        [],
        [],
        [],
        [],
    ]


async def test_unknown_movie_is_404(client: httpx.AsyncClient) -> None:
    response = await client.get(URL.format("inexistente"))

    assert response.status_code == 404
    assert response.json() == {"detail": "Filme não encontrado"}
