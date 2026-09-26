from collections.abc import Callable, Sequence
from math import ceil
from typing import Any, TypeVar

from sqlalchemy import ColumnElement, Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.movies.models import (
    DimGenre,
    DimMovie,
    DimPerson,
    DimReview,
    MovieReview,
    PersonType,
    bridge_movie_person,
)
from app.movies.schemas import (
    GenreOut,
    MovieDetail,
    MovieListItem,
    MovieSort,
    Page,
    PerformanceOut,
    RatingSummary,
    ReviewOut,
    SortOrder,
)

DIRECTOR: PersonType = "Diretor"
ACTOR: PersonType = "Ator"
WRITER: PersonType = "Roteirista"

# Tipos genéricos de `_paginate`, que serve a mais de uma listagem.
Row = TypeVar("Row")
Item = TypeVar("Item")


async def _paginate(
    session: AsyncSession,
    stmt: Select[tuple[Row]],
    *,
    page: int,
    page_size: int,
    to_item: Callable[[Row], Item],
) -> Page[Item]:
    total = await _count(session, stmt)
    pages = ceil(total / page_size)

    if page > pages:
        rows: Sequence[Row] = []
    else:
        offset = (page - 1) * page_size
        rows = (await session.scalars(stmt.offset(offset).limit(page_size))).all()

    return Page(
        items=[to_item(row) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


async def _count(session: AsyncSession, stmt: Select[tuple[Row]]) -> int:
    unordered = stmt.order_by(None).subquery()
    return await session.scalar(select(func.count()).select_from(unordered)) or 0


def _rating_summary(movie: DimMovie) -> RatingSummary:
    summary = movie.reviews_summary
    if summary is None:
        return RatingSummary(qtd_avaliacoes=0, media_nota=None)
    media = summary.nota_media_usuarios
    return RatingSummary(
        qtd_avaliacoes=summary.qtd_avaliacoes_usuarios,
        media_nota=None if media is None else round(media, 1),
    )


def _names_of(movie: DimMovie, tipo: PersonType) -> list[str]:
    return sorted(person.nome_pessoa for person in movie.people if person.tipo_pessoa == tipo)


def _list_item_fields(movie: DimMovie) -> dict[str, Any]:
    return {
        "sk_movie_id": movie.sk_movie_id,
        "titulo": movie.titulo,
        "ano_lancamento": movie.ano_lancamento,
        "url_poster": movie.url_poster,
        "generos": [genre.nome_genero for genre in movie.genres],
        "diretores": _names_of(movie, DIRECTOR),
        "avaliacao": _rating_summary(movie),
    }


def _to_detail(movie: DimMovie) -> MovieDetail:
    performance = movie.performance
    return MovieDetail(
        **_list_item_fields(movie),
        id_filme=movie.id_filme,
        sinopse=movie.sinopse,
        data_lancamento=movie.data_lancamento,
        duracao_minutos=movie.duracao_minutos,
        status_filme=movie.status_filme,
        url_backdrop=movie.url_backdrop,
        elenco=_names_of(movie, ACTOR),
        roteiristas=_names_of(movie, WRITER),
        produtoras=[company.nome_produtora for company in movie.companies],
        desempenho=None if performance is None else PerformanceOut.model_validate(performance),
    )


def _matches_title_or_director(q: str) -> ColumnElement[bool]:
    directed_movies = (
        select(bridge_movie_person.c.sk_movie_id)
        .join(DimPerson, DimPerson.sk_person_id == bridge_movie_person.c.sk_person_id)
        .where(
            DimPerson.tipo_pessoa == DIRECTOR,
            DimPerson.nome_pessoa.icontains(q, autoescape=True),
        )
    )
    return or_(
        DimMovie.titulo.icontains(q, autoescape=True),
        DimMovie.sk_movie_id.in_(directed_movies),
    )


def _sorted(
    stmt: Select[tuple[DimMovie]], sort: MovieSort, order: SortOrder, *, searching: bool
) -> Select[tuple[DimMovie]]:
    if sort == "titulo":
        # Com `q`, poucos filmes casam e percorrer o índice de título em ordem lê as 95 mil linhas
        # por acesso aleatório `titulo || ''` tira o índice do ORDER BY, fazendo o SQLite varrer
        # a tabela e ordenar só os que casaram. Sem `q` o índice é o caminho rápido.
        column = DimMovie.titulo.concat("") if searching else DimMovie.titulo
    elif sort == "ano":
        column = DimMovie.ano_lancamento
    else:
        stmt = stmt.outerjoin(DimMovie.reviews_summary)
        column = DimReview.nota_media_usuarios

    direction = column.desc() if order == "desc" else column.asc()
    if sort == "titulo":
        return stmt.order_by(direction, DimMovie.sk_movie_id)
    # filmes sem ano ou sem avaliações vão para o fim nos dois sentidos.
    return stmt.order_by(direction.nulls_last(), DimMovie.titulo, DimMovie.sk_movie_id)


async def list_movies(
    session: AsyncSession,
    *,
    page: int,
    page_size: int,
    q: str | None = None,
    genero: str | None = None,
    ano: int | None = None,
    sort: MovieSort = "titulo",
    order: SortOrder = "asc",
) -> Page[MovieListItem]:
    stmt = select(DimMovie).options(
        selectinload(DimMovie.genres),
        selectinload(DimMovie.people.and_(DimPerson.tipo_pessoa == DIRECTOR)),
        selectinload(DimMovie.reviews_summary),
    )
    if q is not None:
        stmt = stmt.where(_matches_title_or_director(q))
    if genero is not None:
        stmt = stmt.where(DimMovie.genres.any(DimGenre.nome_genero == genero))
    if ano is not None:
        stmt = stmt.where(DimMovie.ano_lancamento == ano)

    return await _paginate(
        session,
        _sorted(stmt, sort, order, searching=q is not None),
        page=page,
        page_size=page_size,
        to_item=lambda movie: MovieListItem(**_list_item_fields(movie)),
    )


async def list_genres(session: AsyncSession) -> list[GenreOut]:
    genres = await session.scalars(select(DimGenre).order_by(DimGenre.nome_genero))
    return [GenreOut.model_validate(genre) for genre in genres]


async def get_movie(session: AsyncSession, sk_movie_id: str) -> MovieDetail | None:
    movie = await session.scalar(
        select(DimMovie)
        .where(DimMovie.sk_movie_id == sk_movie_id)
        .options(
            selectinload(DimMovie.genres),
            selectinload(DimMovie.people),
            selectinload(DimMovie.companies),
            selectinload(DimMovie.performance),
            selectinload(DimMovie.reviews_summary),
        )
    )
    return None if movie is None else _to_detail(movie)


async def list_reviews(
    session: AsyncSession, sk_movie_id: str, *, page: int, page_size: int
) -> Page[ReviewOut] | None:

    movie_exists = await session.scalar(
        select(DimMovie.sk_movie_id).where(DimMovie.sk_movie_id == sk_movie_id)
    )
    if movie_exists is None:
        return None

    stmt = (
        select(MovieReview)
        .where(MovieReview.sk_movie_id == sk_movie_id)
        # As reviews do seed compartilham o mesmo created_at e o id mantém as páginas estáveis.
        .order_by(MovieReview.created_at.desc(), MovieReview.sk_movie_review_id)
    )
    return await _paginate(
        session, stmt, page=page, page_size=page_size, to_item=ReviewOut.model_validate
    )
