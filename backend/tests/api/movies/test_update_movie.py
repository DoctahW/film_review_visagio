from datetime import date
from decimal import Decimal
from typing import Any

import httpx
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.movies.models import DimGenre, DimPerson, FactMoviePerformance
from tests.factories import make_movie

URL = "/api/v1/movies/{}"

VALID: dict[str, Any] = {
    "titulo": "Título novo",
    "diretor": "Diretora Nova",
    "ano_lancamento": 2010,
    "generos": ["Drama", "Comédia"],
}


async def test_replaces_director_and_genres_keeping_cast_reviews_and_origin_data(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    movie = await make_movie(
        db_session,
        titulo="Título antigo",
        id_filme="tt0000001",
        ano_lancamento=2010,
        data_lancamento=date(2010, 7, 16),
        status_filme="Released",
        sinopse="Sinopse antiga",
        url_poster="https://exemplo.test/antigo.jpg",
        url_backdrop="https://exemplo.test/backdrop.jpg",
        generos=["Ação", "Drama"],
        diretores=["Diretor Antigo", "Codiretor Antigo"],
        # Mesmo nome como ator é outra pessoa (nome + tipo) e continua no elenco.
        elenco=["Diretor Antigo", "Atriz"],
        roteiristas=["Roteirista"],
        produtoras=["Estúdio"],
        notas=[6.0, 9.0],
        performance=FactMoviePerformance(lucro_usd=Decimal("1.00"), lucro_brl=Decimal("5.00")),
    )

    response = await client.put(
        URL.format(movie.sk_movie_id),
        json={**VALID, "titulo": "  Título novo ", "duracao_minutos": 95},
    )

    assert response.status_code == 200
    body = response.json()
    assert {key: value for key, value in body.items() if key != "desempenho"} == {
        "sk_movie_id": movie.sk_movie_id,
        "id_filme": "tt0000001",
        "titulo": "Título novo",
        "ano_lancamento": 2010,
        "data_lancamento": "2010-07-16",
        "status_filme": "Released",
        # PUT substitui todos os campos editáveis: o que não veio no payload vira null.
        "sinopse": None,
        "url_poster": None,
        "duracao_minutos": 95,
        "url_backdrop": "https://exemplo.test/backdrop.jpg",
        "generos": ["Comédia", "Drama"],
        "diretores": ["Diretora Nova"],
        "elenco": ["Atriz", "Diretor Antigo"],
        "roteiristas": ["Roteirista"],
        "produtoras": ["Estúdio"],
        "avaliacao": {"qtd_avaliacoes": 2, "media_nota": 7.5},
    }
    assert (body["desempenho"]["lucro_usd"], body["desempenho"]["lucro_brl"]) == (1.0, 5.0)
    assert (await client.get(URL.format(movie.sk_movie_id))).json() == body

    # Os diretores antigos continuam em dim_people, só deixaram de dirigir este filme.
    directors = await db_session.scalars(
        select(DimPerson.nome_pessoa)
        .where(DimPerson.tipo_pessoa == "Diretor")
        .order_by(DimPerson.nome_pessoa)
    )
    assert directors.all() == ["Codiretor Antigo", "Diretor Antigo", "Diretora Nova"]
    by_old_director = await client.get("/api/v1/movies", params={"q": "antigo"})
    assert by_old_director.json()["total"] == 0
    by_new_director = await client.get("/api/v1/movies", params={"q": "diretora nova"})
    assert [item["sk_movie_id"] for item in by_new_director.json()["items"]] == [movie.sk_movie_id]


async def test_changing_year_clears_release_date_of_other_year(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    movie = await make_movie(db_session, ano_lancamento=2010, data_lancamento=date(2010, 7, 16))

    response = await client.put(
        URL.format(movie.sk_movie_id), json={**VALID, "ano_lancamento": 2011}
    )

    assert response.status_code == 200
    assert (response.json()["ano_lancamento"], response.json()["data_lancamento"]) == (2011, None)


async def test_same_director_and_genres_ignoring_case_are_kept_without_duplicates(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    movie = await make_movie(
        db_session, diretores=["Christopher Nolan"], generos=["Drama"], elenco=["Ator"]
    )

    response = await client.put(
        URL.format(movie.sk_movie_id),
        json={**VALID, "diretor": "christopher NOLAN", "generos": ["drama", "Thriller"]},
    )

    assert response.status_code == 200
    body = response.json()
    assert (body["diretores"], body["generos"], body["elenco"]) == (
        ["Christopher Nolan"],
        ["Drama", "Thriller"],
        ["Ator"],
    )
    assert await db_session.scalar(select(func.count()).select_from(DimPerson)) == 2
    assert await db_session.scalar(select(func.count()).select_from(DimGenre)) == 2


async def test_invalid_payload_is_422_and_changes_nothing(
    client: httpx.AsyncClient, db_session: AsyncSession
) -> None:
    movie = await make_movie(db_session, titulo="Intacto", generos=["Drama"])

    response = await client.put(URL.format(movie.sk_movie_id), json={**VALID, "generos": []})

    assert response.status_code == 422
    detail = (await client.get(URL.format(movie.sk_movie_id))).json()
    assert (detail["titulo"], detail["generos"]) == ("Intacto", ["Drama"])


async def test_unknown_movie_is_404(client: httpx.AsyncClient) -> None:
    response = await client.put(URL.format("inexistente"), json=VALID)

    assert response.status_code == 404
    assert response.json() == {"detail": "Filme não encontrado"}
