import { describe, expect, it } from 'vitest'

import { schemas, type MovieDetail } from '@/lib/api'

import {
  emptyMovieForm,
  movieFormSchema,
  movieToFormValues,
  type MovieFormValues,
} from './movie-form.schema'

const valid: MovieFormValues = {
  titulo: '  Duna  ',
  diretores: ['Denis Villeneuve'],
  ano_lancamento: 2021,
  generos: ['Science Fiction'],
  sinopse: '',
  url_poster: '',
  duracao_minutos: null,
}

describe('movieFormSchema', () => {
  it('gera um corpo aceito pelo MovieCreate do backend, com opcionais vazios em null', () => {
    const body = movieFormSchema.parse(valid)

    expect(schemas.zMovieCreate.parse(body)).toEqual(body)
    expect(body).toMatchObject({ titulo: 'Duna', sinopse: null, url_poster: null })
  })

  it.each<[string, Partial<MovieFormValues>]>([
    ['sem gêneros', { generos: [] }],
    ['sem diretores', { diretores: [] }],
    ['ano antes de 1888', { ano_lancamento: 1887 }],
    ['duração zero', { duracao_minutos: 0 }],
    ['URL de pôster inválida', { url_poster: 'poster.jpg' }],
  ])('rejeita o que o backend rejeita: %s', (_, override) => {
    const values = { ...valid, ...override }

    expect(movieFormSchema.safeParse(values).success).toBe(false)
    const body = { ...values, sinopse: null, url_poster: values.url_poster || null }
    expect(schemas.zMovieCreate.safeParse(body).success).toBe(false)
  })

  it('apara espaços como o backend (o strip do Pydantic não aparece no OpenAPI)', () => {
    expect(movieFormSchema.safeParse({ ...valid, titulo: '   ' }).success).toBe(false)
    expect(movieFormSchema.safeParse({ ...valid, diretores: ['  '] }).success).toBe(false)
  })

  it('exige o ano em vez de inventar um', () => {
    const result = movieFormSchema.safeParse(emptyMovieForm)

    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ path: ['ano_lancamento'], message: 'Informe o ano' }),
    )
  })
})

describe('movieToFormValues', () => {
  it('reenvia no PUT todos os campos editáveis do filme (D15)', () => {
    const movie = {
      titulo: 'The Matrix Resurrections',
      diretores: ['Lana Wachowski'],
      ano_lancamento: 2021,
      generos: ['Action', 'Science Fiction'],
      sinopse: 'Neo volta.',
      url_poster: 'https://image.tmdb.org/t/p/w500/x.jpg',
      duracao_minutos: 148,
    } as MovieDetail

    expect(movieFormSchema.parse(movieToFormValues(movie))).toEqual({
      titulo: movie.titulo,
      diretores: movie.diretores,
      ano_lancamento: movie.ano_lancamento,
      generos: movie.generos,
      sinopse: movie.sinopse,
      url_poster: movie.url_poster,
      duracao_minutos: movie.duracao_minutos,
    })
  })
})
