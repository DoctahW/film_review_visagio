from collections.abc import Callable, Iterable, Sequence
from datetime import date
from math import ceil
from typing import Any, TypeVar
from uuid import uuid4

from sqlalchemy import ColumnElement, Select, delete, func, or_, select
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.movies.models import (
    DimGenre,
    DimMovie,
    DimPerson,
    DimReview,
    FactMoviePerformance,
    MovieReview,
    PersonType,
    bridge_movie_person,
)
from app.movies.schemas import (
    GenreOut,
    MovieCreate,
    MovieDetail,
    MovieListItem,
    MovieSort,
    Page,
    PerformanceOut,
    RatingSummary,
    ReviewCreate,
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
    elif sort == "lancamento":
        column = DimMovie.data_lancamento
    elif sort == "popularidade":
        stmt = stmt.outerjoin(DimMovie.performance)
        column = FactMoviePerformance.popularidade
    else:
        stmt = stmt.outerjoin(DimMovie.reviews_summary)
        column = DimReview.nota_media_usuarios

    direction = column.desc() if order == "desc" else column.asc()
    if sort == "titulo":
        return stmt.order_by(direction, DimMovie.sk_movie_id)
    # filmes sem ano, data, avaliações ou popularidade vão para o fim nos dois sentidos.
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
    lancados: bool = False,
    min_votos: int | None = None,
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
    if lancados:
        stmt = stmt.where(DimMovie.data_lancamento <= date.today())
    if min_votos is not None:
        stmt = stmt.where(DimMovie.performance.has(FactMoviePerformance.qtd_tmdb >= min_votos))

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
        .execution_options(populate_existing=True)
    )
    return None if movie is None else _to_detail(movie)


async def _get_or_create_genre(session: AsyncSession, nome: str) -> DimGenre:
    genre = await session.scalar(
        select(DimGenre).where(DimGenre.nome_genero.collate("NOCASE") == nome).limit(1)
    )
    return genre or DimGenre(nome_genero=nome)


async def _get_or_create_people(
    session: AsyncSession, nomes: Iterable[str], tipo: PersonType
) -> list[DimPerson]:
    # Uma varredura de dim_people para todos os nomes (NOCASE não usa índice): um filme do CSV
    # tem até 88 diretores e uma consulta por nome custaria ~20 ms cada.
    unique = _unique_ignoring_case(nomes)
    found = await session.scalars(
        select(DimPerson).where(
            DimPerson.tipo_pessoa == tipo, DimPerson.nome_pessoa.collate("NOCASE").in_(unique)
        )
    )
    by_name = {person.nome_pessoa.lower(): person for person in found}
    return [
        by_name.get(nome.lower()) or DimPerson(nome_pessoa=nome, tipo_pessoa=tipo)
        for nome in unique
    ]


def _unique_ignoring_case(nomes: Iterable[str]) -> list[str]:
    unique: dict[str, str] = {}
    for nome in nomes:
        unique.setdefault(nome.lower(), nome)
    return list(unique.values())


def _editable_fields(data: MovieCreate) -> dict[str, Any]:
    return {
        "titulo": data.titulo,
        "ano_lancamento": data.ano_lancamento,
        "sinopse": data.sinopse or None,
        "url_poster": None if data.url_poster is None else str(data.url_poster),
        "duracao_minutos": data.duracao_minutos,
    }


async def _genres_of(session: AsyncSession, data: MovieCreate) -> list[DimGenre]:
    return [
        await _get_or_create_genre(session, nome) for nome in _unique_ignoring_case(data.generos)
    ]


async def create_movie(session: AsyncSession, data: MovieCreate) -> MovieDetail:
    movie = DimMovie(
        id_filme=f"local-{uuid4().hex[:12]}",
        **_editable_fields(data),
        genres=await _genres_of(session, data),
        people=await _get_or_create_people(session, data.diretores, DIRECTOR),
        reviews_summary=DimReview(qtd_avaliacoes_usuarios=0, nota_media_usuarios=None),
    )
    session.add(movie)
    await session.commit()

    detail = await get_movie(session, movie.sk_movie_id)
    assert detail is not None
    return detail


async def update_movie(
    session: AsyncSession, sk_movie_id: str, data: MovieCreate
) -> MovieDetail | None:
    movie = await session.scalar(
        select(DimMovie)
        .where(DimMovie.sk_movie_id == sk_movie_id)
        .options(selectinload(DimMovie.genres), selectinload(DimMovie.people))
    )
    if movie is None:
        return None

    for field, value in _editable_fields(data).items():
        setattr(movie, field, value)
    # A data completa não é editável; se o ano mudou, ela contradiria o novo ano no detalhe.
    if movie.data_lancamento is not None and movie.data_lancamento.year != data.ano_lancamento:
        movie.data_lancamento = None
    movie.genres = await _genres_of(session, data)
    directors = await _get_or_create_people(session, data.diretores, DIRECTOR)
    others = [person for person in movie.people if person.tipo_pessoa != DIRECTOR]
    movie.people = [*others, *directors]
    await session.commit()

    return await get_movie(session, sk_movie_id)


async def delete_movie(session: AsyncSession, sk_movie_id: str) -> bool:
    deleted = await session.scalar(
        delete(DimMovie).where(DimMovie.sk_movie_id == sk_movie_id).returning(DimMovie.sk_movie_id)
    )
    await session.commit()
    return deleted is not None


async def _movie_exists(session: AsyncSession, sk_movie_id: str) -> bool:
    found = await session.scalar(
        select(DimMovie.sk_movie_id).where(DimMovie.sk_movie_id == sk_movie_id)
    )
    return found is not None


async def list_reviews(
    session: AsyncSession, sk_movie_id: str, *, page: int, page_size: int
) -> Page[ReviewOut] | None:
    if not await _movie_exists(session, sk_movie_id):
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


async def recalculate_summary(session: AsyncSession, sk_movie_id: str) -> None:
    qtd, media = (
        await session.execute(
            select(func.count(), func.avg(MovieReview.nota)).where(
                MovieReview.sk_movie_id == sk_movie_id
            )
        )
    ).one()
    # Filmes do CSV sem reviews não têm linha em dim_reviews: a primeira review a cria.
    upsert = sqlite_insert(DimReview).values(
        sk_movie_id=sk_movie_id, qtd_avaliacoes_usuarios=qtd, nota_media_usuarios=media
    )
    await session.execute(
        upsert.on_conflict_do_update(
            index_elements=[DimReview.sk_movie_id],
            set_={
                "qtd_avaliacoes_usuarios": upsert.excluded.qtd_avaliacoes_usuarios,
                "nota_media_usuarios": upsert.excluded.nota_media_usuarios,
            },
        )
    )


async def add_review(
    session: AsyncSession, sk_movie_id: str, data: ReviewCreate
) -> ReviewOut | None:
    if not await _movie_exists(session, sk_movie_id):
        return None

    review = MovieReview(
        sk_movie_id=sk_movie_id, nome=data.nome, nota=data.nota, comentario=data.comentario
    )
    session.add(review)
    await session.flush()
    await recalculate_summary(session, sk_movie_id)
    await session.commit()
    return ReviewOut.model_validate(review)
