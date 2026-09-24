from math import ceil

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.movies.models import DimMovie, DimPerson
from app.movies.schemas import MovieListItem, Page, RatingSummary

DIRECTOR = "Diretor"


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
    stmt = select(DimMovie)
    total = await session.scalar(select(func.count()).select_from(stmt.subquery())) or 0

    offset = (page - 1) * page_size
    movies: list[DimMovie] = []
    # Sem este guard, `page` gigante estoura o INTEGER do SQLite no OFFSET (500).
    if offset < total:
        result = await session.scalars(
            stmt.options(
                selectinload(DimMovie.genres),
                selectinload(DimMovie.people.and_(DimPerson.tipo_pessoa == DIRECTOR)),
                selectinload(DimMovie.reviews_summary),
            )
            # sk_movie_id desempata títulos repetidos e mantém as páginas estáveis.
            .order_by(DimMovie.titulo, DimMovie.sk_movie_id)
            .offset(offset)
            .limit(page_size)
        )
        movies = list(result)

    return Page(
        items=[_to_list_item(movie) for movie in movies],
        total=total,
        page=page,
        page_size=page_size,
        pages=ceil(total / page_size),
    )
