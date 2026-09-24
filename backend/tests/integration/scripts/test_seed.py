import csv
from collections.abc import Iterator
from decimal import Decimal
from pathlib import Path

import pytest
from sqlalchemy import Engine, func, select

from app.db.base import Base
from app.movies.models import DimMovie, DimReview, FactMoviePerformance, MovieReview
from app.scripts.seed import create_seed_engine, main, seed

MOVIE_A = "a" * 64
MOVIE_B = "b" * 64
DIRECTOR = "c" * 64
ACTOR = "d" * 64
GENRE = "e" * 64
COMPANY = "f" * 64

FILES: dict[str, list[list[str]]] = {
    "dim_movies.csv": [
        [
            "sk_movie_id",
            "id_filme",
            "titulo",
            "data_lancamento",
            "ano_lancamento",
            "duracao_minutos",
            "status_filme",
            "sinopse",
            "url_poster",
            "url_backdrop",
        ],
        [
            MOVIE_A,
            "1",
            "Filme, com vírgula",
            "1999-03-31",
            "1999",
            "136",
            "Lançado",
            "Sinopse do filme A",
            "https://exemplo.test/a.jpg",
            "",
        ],
        [MOVIE_B, "2", "Filme B", "", "", "", "", "", "", ""],
    ],
    "dim_genres.csv": [["nome_genero", "sk_genre_id"], ["Ficção", GENRE]],
    "dim_companies.csv": [["nome_produtora", "sk_company_id"], ["Estúdio X", COMPANY]],
    "dim_people.csv": [
        ["nome_pessoa", "tipo_pessoa", "sk_person_id"],
        ["Lana Wachowski", "Diretor", DIRECTOR],
        ["Keanu Reeves", "Ator", ACTOR],
    ],
    "bridge_movie_genre.csv": [
        ["sk_movie_id", "sk_genre_id"],
        [MOVIE_A, GENRE],
        [MOVIE_B, GENRE],
    ],
    "bridge_movie_company.csv": [["sk_movie_id", "sk_company_id"], [MOVIE_A, COMPANY]],
    "bridge_movie_person.csv": [
        ["sk_movie_id", "sk_person_id"],
        [MOVIE_A, DIRECTOR],
        [MOVIE_A, ACTOR],
    ],
    "fact_movies_performance.csv": [
        [
            "sk_movie_id",
            "orcamento_usd",
            "receita_usd",
            "lucro_usd",
            "orcamento_brl",
            "receita_brl",
            "lucro_brl",
            "popularidade",
            "nota_tmdb",
            "qtd_tmdb",
            "nota_imdb",
            "qtd_imdb",
        ],
        [
            MOVIE_A,
            "63000000.0",
            "463517383.0",
            "400517383.0",
            "",
            "",
            "0",
            "35.5",
            "8.2",
            "2375.0",
            "8.7",
            "1900000.0",
        ],
        [MOVIE_B, "", "", "0", "", "", "0", "", "", "", "", ""],
    ],
    "movies_reviews.csv": [
        ["sk_movie_review_id", "sk_movie_id", "nome", "nota", "comentario"],
        ["1" * 64, MOVIE_A, "Ana", "8.0", "Muito bom"],
        ["2" * 64, MOVIE_A, "Bruno", "9.0", "Excelente"],
        ["3" * 64, MOVIE_B, "Carla", "7.0", "Ok"],
    ],
    # Presente no diretório de propósito: o seed deve ignorá-lo.
    "dim_reviews.csv": [
        ["sk_review_id", "sk_movie_id", "qtd_avaliacoes_usuarios", "nota_media_usuarios"],
        ["9" * 64, MOVIE_A, "99", "1.0"],
    ],
}

EXPECTED_COUNTS = {
    "dim_movies": 2,
    "dim_genres": 1,
    "dim_companies": 1,
    "dim_people": 2,
    "bridge_movie_genre": 2,
    "bridge_movie_company": 1,
    "bridge_movie_person": 2,
    "fact_movies_performance": 2,
    "movie_reviews": 3,
    "dim_reviews": 2,
}


@pytest.fixture
def data_dir(tmp_path: Path) -> Path:
    directory = tmp_path / "csv"
    directory.mkdir()
    for name, rows in FILES.items():
        with (directory / name).open("w", newline="", encoding="utf-8") as file:
            csv.writer(file).writerows(rows)
    return directory


@pytest.fixture
def engine(database_path: Path) -> Iterator[Engine]:
    engine = create_seed_engine(f"sqlite:///{database_path}")
    yield engine
    engine.dispose()


def test_seed_populates_every_table_from_csv(engine: Engine, data_dir: Path) -> None:
    counts = seed(engine, data_dir)

    assert counts == EXPECTED_COUNTS
    with engine.connect() as connection:
        assert (
            connection.scalar(select(func.count()).select_from(Base.metadata.tables["dim_movies"]))
            == 2
        )
        movie = connection.execute(select(DimMovie).where(DimMovie.sk_movie_id == MOVIE_A)).one()
        # String vazia vira NULL; vírgula dentro de aspas sobrevive ao DictReader.
        assert movie.titulo == "Filme, com vírgula"
        assert movie.url_backdrop is None
        performance = connection.execute(
            select(FactMoviePerformance).where(FactMoviePerformance.sk_movie_id == MOVIE_A)
        ).one()
        assert performance.orcamento_usd == Decimal("63000000.00")
        assert performance.orcamento_brl is None
        assert performance.qtd_tmdb == 2375
        assert performance.qtd_imdb == 1_900_000
        review = connection.execute(select(DimReview).where(DimReview.sk_movie_id == MOVIE_A)).one()
        assert review.qtd_avaliacoes_usuarios == 2
        assert review.nota_media_usuarios == pytest.approx(8.5)
        assert [
            row.nota
            for row in connection.execute(
                select(MovieReview).where(MovieReview.sk_movie_id == MOVIE_A)
            )
        ] == [8.0, 9.0]


def test_seed_is_idempotent_and_reset_reloads(engine: Engine, data_dir: Path) -> None:
    seed(engine, data_dir)

    assert seed(engine, data_dir) is None
    assert main(["--data-dir", str(data_dir)]) == 0
    with engine.connect() as connection:
        for table_name, expected in EXPECTED_COUNTS.items():
            actual = connection.scalar(
                select(func.count()).select_from(Base.metadata.tables[table_name])
            )
            assert actual == expected, table_name

    assert seed(engine, data_dir, reset=True) == EXPECTED_COUNTS


def test_seed_requires_migrated_schema(data_dir: Path, tmp_path: Path) -> None:
    engine = create_seed_engine(f"sqlite:///{tmp_path / 'empty.db'}")
    try:
        with pytest.raises(RuntimeError, match="alembic upgrade head"):
            seed(engine, data_dir)
    finally:
        engine.dispose()


def test_seed_reports_missing_csv(engine: Engine, tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError, match="bridge_movie_person.csv"):
        seed(engine, tmp_path / "inexistente")
