import { describe, expect, it } from 'vitest'

import { movieSearchSchema } from './movie-search.schema'

describe('movieSearchSchema', () => {
  it('aplica os padrões quando a URL não traz parâmetros', () => {
    expect(movieSearchSchema.parse({})).toEqual({ sort: 'popularidade', order: 'desc', page: 1 })
  })

  it('descarta valores inválidos da URL em vez de quebrar a página', () => {
    expect(
      movieSearchSchema.parse({ q: 'a', ano: 3000, sort: 'bogus', order: 'x', page: 0 }),
    ).toEqual({ sort: 'popularidade', order: 'desc', page: 1 })
  })

  it('omite q abaixo do mínimo da API após trim', () => {
    expect(movieSearchSchema.parse({ q: ' a ' }).q).toBeUndefined()
    expect(movieSearchSchema.parse({ q: ' ma ' }).q).toBe('ma')
  })
})
