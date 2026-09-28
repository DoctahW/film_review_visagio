import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute

from app.api.deps import DbSession
from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.db.session import engine
from app.db.status import STATUS_HINTS, DatabaseStatus, check_database

configure_logging()
settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Avisa se o banco não está pronto e libera recursos quando a aplicação é encerrada."""

    del app
    # A criação/evolução do schema é responsabilidade exclusiva do Alembic: aqui só avisamos.
    async with engine.connect() as connection:
        database_status = await check_database(connection)
    if database_status is not DatabaseStatus.READY:
        logger.warning(STATUS_HINTS[database_status])
    yield
    await engine.dispose()


def operation_id(route: APIRoute) -> str:
    """Usa o nome da função da rota como operationId pro OpenAPI."""
    return route.name


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.project_name,
        version=settings.project_version,
        lifespan=lifespan,
        generate_unique_id_function=operation_id,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router, prefix=settings.api_v1_prefix)

    @app.get("/health", tags=["health"])
    async def health_check(session: DbSession) -> dict[str, str]:
        database_status = await check_database(await session.connection())
        if database_status is not DatabaseStatus.READY:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, STATUS_HINTS[database_status])
        return {"status": "ok"}

    return app


app = create_app()
