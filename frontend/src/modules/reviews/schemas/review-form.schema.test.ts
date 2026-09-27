import { describe, expect, it } from 'vitest'

import { schemas } from '@/lib/api'

import { emptyReviewForm, reviewFormSchema } from './review-form.schema'

describe('reviewFormSchema', () => {
  it('gera um corpo aceito pelo ReviewCreate do backend nas bordas 0 e 10', () => {
    for (const nota of [0, 10]) {
      const body = reviewFormSchema.parse({ nome: ' Ana ', nota, comentario: ' Ótimo ' })

      expect(schemas.zReviewCreate.parse(body)).toEqual({ nome: 'Ana', nota, comentario: 'Ótimo' })
    }
  })

  it('exige a nota, que começa vazia', () => {
    const result = reviewFormSchema.safeParse({ ...emptyReviewForm, nome: 'Ana', comentario: 'Ok' })

    expect(result.error?.issues).toEqual([
      expect.objectContaining({ path: ['nota'], message: 'Escolha uma nota' }),
    ])
  })

  it('rejeita nota fora de 0–10', () => {
    for (const nota of [-0.5, 10.5]) {
      expect(reviewFormSchema.safeParse({ nome: 'Ana', nota, comentario: 'Ok' }).success).toBe(
        false,
      )
    }
  })
})
