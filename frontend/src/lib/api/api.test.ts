import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'

import { ApiError, createMovie, getMovie, listGenres } from '.'

const jsonResponse = (status: number, body: unknown) => async () =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('client da API', () => {
  it('converte resposta fora de 2xx em ApiError com o detail do backend', async () => {
    const request = getMovie({
      path: { sk_movie_id: 'inexistente' },
      fetch: jsonResponse(404, { detail: 'Filme não encontrado' }),
    })

    await expect(request).rejects.toBeInstanceOf(ApiError)
    await expect(request).rejects.toMatchObject({ status: 404, message: 'Filme não encontrado' })
  })

  it('mapeia o 422 do FastAPI por campo, com itens de lista no campo da lista', async () => {
    const error: unknown = await createMovie({
      body: { titulo: '', diretores: [''], ano_lancamento: 1500, generos: ['Drama'] },
      fetch: jsonResponse(422, {
        detail: [
          { loc: ['body', 'titulo'], msg: 'Texto curto', type: 'string_too_short' },
          { loc: ['body', 'diretores', 0], msg: 'Nome vazio', type: 'string_too_short' },
          { loc: ['body', 'ano_lancamento'], msg: 'Ano inválido', type: 'greater_than_equal' },
        ],
      }),
    }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).fieldErrors).toEqual({
      titulo: 'Texto curto',
      diretores: 'Nome vazio',
      ano_lancamento: 'Ano inválido',
    })
  })

  it('rejeita resposta 2xx fora do contrato (validação Zod)', async () => {
    const request = listGenres({ fetch: jsonResponse(200, [{ sk_genre_id: 1 }]) })

    await expect(request).rejects.toBeInstanceOf(ZodError)
  })
})
