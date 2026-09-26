from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import DbSession
from app.movies import service
from app.movies.schemas import MovieDetail, MovieListItem, Page, ReviewOut

router = APIRouter()

MOVIE_NOT_FOUND = "Filme não encontrado"
NOT_FOUND_RESPONSE: dict[int | str, dict[str, object]] = {
    status.HTTP_404_NOT_FOUND: {"description": MOVIE_NOT_FOUND}
}

PageNumber = Annotated[int, Query(ge=1)]
PageSize = Annotated[int, Query(ge=1, le=100)]


def _movie_not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=MOVIE_NOT_FOUND)


@router.get("", summary="Lista o catálogo de filmes paginado")
async def list_movies(
    session: DbSession, page: PageNumber = 1, page_size: PageSize = 20
) -> Page[MovieListItem]:
    return await service.list_movies(session, page=page, page_size=page_size)


@router.get("/{sk_movie_id}", summary="Detalha um filme", responses=NOT_FOUND_RESPONSE)
async def get_movie(session: DbSession, sk_movie_id: str) -> MovieDetail:
    movie = await service.get_movie(session, sk_movie_id)
    if movie is None:
        raise _movie_not_found()
    return movie


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
