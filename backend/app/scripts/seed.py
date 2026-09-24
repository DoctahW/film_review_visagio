import argparse
import csv
import sys
import time
from collections.abc import Callable, Iterator
from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import Any

from sqlalchemy import (
    Column,
    Connection,
    Engine,
    Table,
    create_engine,
    delete,
    func,
    insert,
    inspect,
    select,
)
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import get_settings
from app.db.session import register_sqlite_foreign_keys
from app.movies.models import (
    DimCompany,
    DimGenre,
    DimMovie,
    DimPerson,
    DimReview,
    FactMoviePerformance,
    MovieReview,
    bridge_movie_company,
    bridge_movie_genre,
    bridge_movie_person,
    generate_surrogate_key,
)

DEFAULT_DATA_DIR = Path(__file__).resolve().parents[3] / "database_csv"
BATCH_SIZE = 1_000

# Ordem de inserção respeita as chaves estrangeiras e a remoção usa a ordem inversa.
# O nome do arquivo não é derivado da tabela (movies_reviews.csv → movie_reviews).
SOURCES: tuple[tuple[str, Table], ...] = (
    ("dim_movies.csv", DimMovie.__table__),
    ("dim_genres.csv", DimGenre.__table__),
    ("dim_companies.csv", DimCompany.__table__),
    ("dim_people.csv", DimPerson.__table__),
    ("bridge_movie_genre.csv", bridge_movie_genre),
    ("bridge_movie_company.csv", bridge_movie_company),
    ("bridge_movie_person.csv", bridge_movie_person),
    ("fact_movies_performance.csv", FactMoviePerformance.__table__),
    ("movies_reviews.csv", MovieReview.__table__),
)
SEEDED_TABLES: tuple[Table, ...] = (*(table for _, table in SOURCES), DimReview.__table__)


def _to_int(value: str) -> int:
    return int(Decimal(value))


_CONVERTERS: dict[type, Callable[[str], Any]] = {
    str: str,
    int: _to_int,
    float: float,
    Decimal: Decimal,
    date: date.fromisoformat,
}


def _converters_for(table: Table, header: list[str], path: Path) -> dict[str, Callable[[str], Any]]:
    unknown = set(header) - set(table.columns.keys())
    if unknown:
        raise ValueError(
            f"{path.name}: colunas sem correspondência em {table.name}: {sorted(unknown)}"
        )
    return {name: _CONVERTERS[table.columns[name].type.python_type] for name in header}


def _empty_fallback(column: Column) -> Any:
    if not column.nullable and column.default is not None and column.default.is_scalar:
        return column.default.arg
    return None


def _read_batches(path: Path, table: Table) -> Iterator[list[dict[str, Any]]]:
    with path.open(newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        header = list(reader.fieldnames or [])
        converters = _converters_for(table, header, path)
        fallbacks = {name: _empty_fallback(table.columns[name]) for name in header}
        batch: list[dict[str, Any]] = []
        for row in reader:
            batch.append(
                {
                    # `raw` também vem None quando a linha do CSV é mais curta que o header.
                    name: fallbacks[name] if not raw else converters[name](raw)
                    for name, raw in row.items()
                }
            )
            if len(batch) == BATCH_SIZE:
                yield batch
                batch = []
        if batch:
            yield batch


def _build_reviews_summary(connection: Connection) -> None:
    summary = connection.execute(
        select(MovieReview.sk_movie_id, func.count(), func.avg(MovieReview.nota)).group_by(
            MovieReview.sk_movie_id
        )
    ).all()
    rows = [
        {
            "sk_review_id": generate_surrogate_key(),
            "sk_movie_id": sk_movie_id,
            "qtd_avaliacoes_usuarios": count,
            "nota_media_usuarios": average,
        }
        for sk_movie_id, count, average in summary
    ]
    for start in range(0, len(rows), BATCH_SIZE):
        connection.execute(insert(DimReview.__table__), rows[start : start + BATCH_SIZE])


def _count_rows(connection: Connection) -> dict[str, int]:
    return {
        table.name: connection.scalar(select(func.count()).select_from(table))
        for table in SEEDED_TABLES
    }


def seed(engine: Engine, data_dir: Path, *, reset: bool = False) -> dict[str, int] | None:
    missing = [name for name, _ in SOURCES if not (data_dir / name).is_file()]
    if missing:
        raise FileNotFoundError(f"CSVs ausentes em {data_dir}: {', '.join(missing)}")
    if not inspect(engine).has_table(DimMovie.__tablename__):
        raise RuntimeError("Tabelas inexistentes: rode `alembic upgrade head` antes do seed.")

    with engine.begin() as connection:
        if connection.scalar(select(func.count()).select_from(DimMovie.__table__)):
            if not reset:
                return None
            for table in reversed(SEEDED_TABLES):
                connection.execute(delete(table))

        for file_name, table in SOURCES:
            for batch in _read_batches(data_dir / file_name, table):
                connection.execute(insert(table), batch)
        _build_reviews_summary(connection)
        return _count_rows(connection)


def create_seed_engine(database_url: str) -> Engine:
    engine = create_engine(database_url.replace("+aiosqlite", ""))
    register_sqlite_foreign_keys(engine)
    return engine


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Carrega os CSVs")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument(
        "--reset", action="store_true", help="apaga os dados existentes e recarrega"
    )
    args = parser.parse_args(argv)

    engine = create_seed_engine(get_settings().database_url)
    started = time.perf_counter()
    try:
        counts = seed(engine, args.data_dir, reset=args.reset)
    except (FileNotFoundError, RuntimeError, ValueError, SQLAlchemyError) as error:
        print(f"Erro: {error}", file=sys.stderr)
        return 1
    finally:
        engine.dispose()

    if counts is None:
        print("Banco já populado. Use --reset para recarregar.")
        return 0
    width = max(map(len, counts))
    for table_name, count in counts.items():
        print(f"{table_name:<{width}}  {count:>9,}".replace(",", "."))
    print(f"Carga concluída em {time.perf_counter() - started:.1f}s.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
