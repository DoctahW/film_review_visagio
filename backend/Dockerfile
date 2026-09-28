FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_ROOT_USER_ACTION=ignore

# Mesmo UID do usuário típico do host, para arquivos criados no bind mount não virarem do root.
RUN useradd --create-home --uid 1000 app && mkdir /app /data && chown app:app /app /data

WORKDIR /app

# Instala só as dependências primeiro para o cache sobreviver a mudanças no código.
COPY pyproject.toml ./
COPY app/__init__.py app/__init__.py
RUN pip install -e ".[dev]"

COPY --chown=app:app . .
USER app

EXPOSE 8000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
