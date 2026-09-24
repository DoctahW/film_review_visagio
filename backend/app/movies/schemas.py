from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int


class RatingSummary(BaseModel):
    qtd_avaliacoes: int
    media_nota: float | None  # Escala 0–10 (D1), sem conversão para estrelas.


class MovieListItem(BaseModel):
    sk_movie_id: str
    titulo: str
    ano_lancamento: int | None
    url_poster: str | None
    generos: list[str]
    diretores: list[str]
    avaliacao: RatingSummary
