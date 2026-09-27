import { z } from 'zod'

import type { ReviewCreate } from '@/lib/api'

// Limites espelham `ReviewCreate`; `review-form.schema.test.ts` confere contra o schema gerado.
export const reviewFormSchema = z.object({
  nome: z.string().trim().min(1, 'Informe seu nome').max(120),
  // A nota começa vazia e é obrigatória.
  nota: z
    .number()
    .min(0)
    .max(10)
    .nullable()
    .transform((nota, ctx) => {
      if (nota !== null) return nota
      ctx.addIssue({ code: 'custom', message: 'Escolha uma nota' })
      return z.NEVER
    }),
  comentario: z.string().trim().min(1, 'Escreva a resenha').max(4000),
}) satisfies z.ZodType<ReviewCreate, unknown>

export type ReviewFormValues = z.input<typeof reviewFormSchema>

export const emptyReviewForm: ReviewFormValues = { nome: '', nota: null, comentario: '' }
