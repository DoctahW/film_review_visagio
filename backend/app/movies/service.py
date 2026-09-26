from collections.abc import Callable, Sequence
from math import ceil
from typing import Any, TypeVar

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.movies.models import DimMovie, DimPerson, MovieReview, PersonType
from app.movies.schemas import (
    MovieDetail,
    MovieListItem,
    Page,
    PerformanceOut,
    RatingSummary,
    ReviewOut,
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


async def list_movies(session: AsyncSession, *, page: int, page_size: int) -> Page[MovieListItem]:
    stmt = (
        select(DimMovie)
        .options(
            selectinload(DimMovie.genres),
            selectinload(DimMovie.people.and_(DimPerson.tipo_pessoa == DIRECTOR)),
            selectinload(DimMovie.reviews_summary),
        )
        .order_by(DimMovie.titulo, DimMovie.sk_movie_id)
    )
    return await _paginate(
        session,
        stmt,
        page=page,
        page_size=page_size,
        to_item=lambda movie: MovieListItem(**_list_item_fields(movie)),
    )


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
