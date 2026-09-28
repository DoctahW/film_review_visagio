#!/bin/sh
set -e

alembic upgrade head

echo "Conferindo a carga dos CSVs (a primeira carga leva alguns minutos)..."
if ! python -m app.scripts.seed; then
    echo "A API não vai subir sem dados: coloque os CSVs em backend/database_csv/ e rode 'docker compose up' de novo." >&2
    exit 1
fi

exec "$@"
