from datetime import date, datetime
from typing import Annotated, Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, StringConstraints, UrlConstraints

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


def _text(max_length: int, *, min_length: int = 1) -> StringConstraints:
    # Espaços nas pontas são removidos antes de validar: "   " não passa como título.
    return StringConstraints(strip_whitespace=True, min_length=min_length, max_length=max_length)


class MovieCreate(BaseModel):
    titulo: Annotated[str, _text(500)]
    diretor: Annotated[str, _text(255)]
    ano_lancamento: int = Field(ge=1888, le=2100)
    generos: list[Annotated[str, _text(50)]] = Field(min_length=1)
    sinopse: Annotated[str, _text(4000, min_length=0)] | None = None
    url_poster: Annotated[HttpUrl, UrlConstraints(max_length=2048)] | None = None
    # O teto só evita estourar o INTEGER do SQLite; o maior valor do catálogo é 13.319.
    duracao_minutos: int | None = Field(default=None, gt=0, le=100_000)


class ReviewCreate(BaseModel):
    nome: Annotated[str, _text(120)]
    nota: float = Field(ge=0, le=10)  # Escala 0–10 (D1); o CHECK `nota_range` é a última defesa.
    comentario: Annotated[str, _text(4000)]


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sk_movie_review_id: str
    nome: str
    nota: float
    comentario: str
    created_at: datetime


class GenreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sk_genre_id: str
    nome_genero: str
