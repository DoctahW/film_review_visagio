from datetime import date, datetime
from typing import Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")

MovieSort = Literal["titulo", "ano", "media"]
SortOrder = Literal["asc", "desc"]


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


class PerformanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    orcamento_usd: float | None
    receita_usd: float | None
    lucro_usd: float
    orcamento_brl: float | None
    receita_brl: float | None
    lucro_brl: float
    popularidade: float | None
    nota_tmdb: float | None
    qtd_tmdb: int | None
    nota_imdb: float | None
    qtd_imdb: int | None


class MovieDetail(MovieListItem):
    id_filme: str
    sinopse: str | None
    data_lancamento: date | None
    duracao_minutos: int | None
    status_filme: str | None
    url_backdrop: str | None
    elenco: list[str]
    roteiristas: list[str]
    produtoras: list[str]
    desempenho: PerformanceOut | None


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sk_movie_review_id: str
    nome: str
    nota: float
    comentario: str
    created_at: datetime
