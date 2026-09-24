from typing import Annotated

from fastapi import APIRouter, Query

from app.api.deps import DbSession
from app.movies import service
from app.movies.schemas import MovieListItem, Page

router = APIRouter()


@router.get("", summary="Lista o catálogo de filmes paginado")
async def list_movies(
    session: DbSession,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> Page[MovieListItem]:
    return await service.list_movies(session, page=page, page_size=page_size)
