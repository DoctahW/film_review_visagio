from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import StringConstraints

from app.api.deps import DbSession
from app.movies import service
from app.movies.schemas import (
    GenreOut,
    MovieCreate,
    MovieDetail,
    MovieListItem,
    MovieSort,
    Page,
    ReviewOut,
    SortOrder,
)

router = APIRouter()
genres_router = APIRouter()

MOVIE_NOT_FOUND = "Filme não encontrado"
NOT_FOUND_RESPONSE: dict[int | str, dict[str, object]] = {
    status.HTTP_404_NOT_FOUND: {"description": MOVIE_NOT_FOUND}
}

PageNumber = Annotated[int, Query(ge=1)]
PageSize = Annotated[int, Query(ge=1, le=100)]
# Uma letra casa quase o catálogo inteiro (`q=a`: 87 mil filmes, ~1 s); o front usa o mesmo mínimo.
SearchTerm = Annotated[
    str | None,
    StringConstraints(strip_whitespace=True, min_length=2),
    Query(
        description="Trecho do título ou do nome de um diretor, sem diferenciar maiúsculas "
        "(mín. 2 caracteres)"
    ),
]
GenreName = Annotated[str | None, Query(min_length=1, description="Nome exato do gênero")]
ReleaseYear = Annotated[int | None, Query(ge=1888, le=2100)]


def _movie_not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=MOVIE_NOT_FOUND)


@router.get("", summary="Lista, busca e filtra o catálogo de filmes paginado")
async def list_movies(
    session: DbSession,
    q: SearchTerm = None,
    genero: GenreName = None,
    ano: ReleaseYear = None,
    sort: MovieSort = "titulo",
    order: SortOrder = "asc",
    page: PageNumber = 1,
    page_size: PageSize = 20,
) -> Page[MovieListItem]:
    return await service.list_movies(
        session,
        page=page,
        page_size=page_size,
        q=q,
        genero=genero,
        ano=ano,
        sort=sort,
        order=order,
    )


@router.post("", status_code=status.HTTP_201_CREATED, summary="Cadastra um filme")
async def create_movie(session: DbSession, data: MovieCreate) -> MovieDetail:
    return await service.create_movie(session, data)


@router.get("/{sk_movie_id}", summary="Detalha um filme", responses=NOT_FOUND_RESPONSE)
async def get_movie(session: DbSession, sk_movie_id: str) -> MovieDetail:
    movie = await service.get_movie(session, sk_movie_id)
    if movie is None:
        raise _movie_not_found()
    return movie


@router.put(
    "/{sk_movie_id}",
    summary="Atualiza um filme (troca diretor e gêneros; mantém elenco e avaliações)",
    responses=NOT_FOUND_RESPONSE,
)
async def update_movie(session: DbSession, sk_movie_id: str, data: MovieCreate) -> MovieDetail:
    movie = await service.update_movie(session, sk_movie_id, data)
    if movie is None:
        raise _movie_not_found()
    return movie


@router.delete(
    "/{sk_movie_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove um filme com suas avaliações",
    responses=NOT_FOUND_RESPONSE,
)
async def delete_movie(session: DbSession, sk_movie_id: str) -> None:
    if not await service.delete_movie(session, sk_movie_id):
        raise _movie_not_found()


@router.get(
    "/{sk_movie_id}/reviews",
    summary="Lista as avaliações de um filme, mais recentes primeiro",
    responses=NOT_FOUND_RESPONSE,
)
async def list_reviews(
    session: DbSession, sk_movie_id: str, page: PageNumber = 1, page_size: PageSize = 20
) -> Page[ReviewOut]:
    reviews = await service.list_reviews(session, sk_movie_id, page=page, page_size=page_size)
    if reviews is None:
        raise _movie_not_found()
    return reviews


@genres_router.get("", summary="Lista os gêneros em ordem alfabética")
async def list_genres(session: DbSession) -> list[GenreOut]:
    return await service.list_genres(session)
