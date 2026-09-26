from collections.abc import Callable, Sequence
from math import ceil
from typing import TypeVar

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.movies.models import DimMovie, DimPerson
from app.movies.schemas import MovieListItem, Page, RatingSummary

DIRECTOR = "Diretor"

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


def _to_list_item(movie: DimMovie) -> MovieListItem:
    return MovieListItem(
        sk_movie_id=movie.sk_movie_id,
        titulo=movie.titulo,
        ano_lancamento=movie.ano_lancamento,
        url_poster=movie.url_poster,
        generos=[genre.nome_genero for genre in movie.genres],
        diretores=sorted(person.nome_pessoa for person in movie.people),
        avaliacao=_rating_summary(movie),
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
    return await _paginate(session, stmt, page=page, page_size=page_size, to_item=_to_list_item)
