from collections.abc import Sequence
from typing import Any
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.movies.models import DimGenre, DimMovie, DimPerson, DimReview, MovieReview, PersonType


async def _get_or_create_genre(session: AsyncSession, nome: str) -> DimGenre:
    genre = await session.scalar(select(DimGenre).where(DimGenre.nome_genero == nome))
    return genre or DimGenre(nome_genero=nome)


async def _get_or_create_person(session: AsyncSession, nome: str, tipo: PersonType) -> DimPerson:
    person = await session.scalar(
        select(DimPerson).where(DimPerson.nome_pessoa == nome, DimPerson.tipo_pessoa == tipo)
    )
    return person or DimPerson(nome_pessoa=nome, tipo_pessoa=tipo)


async def make_movie(
    session: AsyncSession,
    *,
    titulo: str = "Filme de teste",
    generos: Sequence[str] = (),
    diretores: Sequence[str] = (),
    elenco: Sequence[str] = (),
    notas: Sequence[float] = (),
    **campos: Any,
) -> DimMovie:
    """Reaproveita gêneros e pessoas por nome; `notas` também gera o resumo em dim_reviews."""

    campos.setdefault("id_filme", f"test-{uuid4().hex[:12]}")
    movie = DimMovie(titulo=titulo, **campos)
    movie.genres = [await _get_or_create_genre(session, nome) for nome in generos]
    movie.people = [
        *[await _get_or_create_person(session, nome, "Diretor") for nome in diretores],
        *[await _get_or_create_person(session, nome, "Ator") for nome in elenco],
    ]
    if notas:
        movie.reviews = [
            MovieReview(nome=f"Avaliador {index}", nota=nota, comentario="Comentário")
            for index, nota in enumerate(notas, start=1)
        ]
        movie.reviews_summary = DimReview(
            qtd_avaliacoes_usuarios=len(notas), nota_media_usuarios=sum(notas) / len(notas)
        )
    session.add(movie)
    await session.commit()
    return movie
