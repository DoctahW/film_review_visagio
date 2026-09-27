import { z } from 'zod'

import type { MovieCreate, MovieDetail } from '@/lib/api'

// Limites espelham `MovieCreate`: `movie-form.schema.test.ts` confere contra o schema gerado.
export const movieFormSchema = z
  .object({
    titulo: z.string().trim().min(1, 'Informe o título').max(500),
    diretores: z
      .array(z.string().trim().min(1).max(255))
      .min(1, 'Informe ao menos um diretor')
      .max(200),
    // Filmes do CSV podem vir sem ano, mas o PUT exige um: o formulário não inventa valor.
    ano_lancamento: z
      .int()
      .min(1888, 'Ano a partir de 1888')
      .max(2100, 'Ano até 2100')
      .nullable()
      .transform((ano, ctx) => {
        if (ano !== null) return ano
        ctx.addIssue({ code: 'custom', message: 'Informe o ano' })
        return z.NEVER
      }),
    generos: z.array(z.string().trim().min(1).max(50)).min(1, 'Escolha ao menos um gênero'),
    sinopse: z.string().trim().max(4000),
    url_poster: z.union([z.literal(''), z.url('URL inválida').max(2048)]),
    duracao_minutos: z.int().positive('Duração deve ser maior que zero').max(100_000).nullable(),
  })
  // Campos de texto opcionais vazios viram `null` no corpo do POST/PUT.
  .transform((values): MovieCreate => ({
    ...values,
    sinopse: values.sinopse || null,
    url_poster: values.url_poster || null,
  }))

export type MovieFormValues = z.input<typeof movieFormSchema>

export const emptyMovieForm: MovieFormValues = {
  titulo: '',
  diretores: [],
  ano_lancamento: null,
  generos: [],
  sinopse: '',
  url_poster: '',
  duracao_minutos: null,
}

export function movieToFormValues(movie: MovieDetail): MovieFormValues {
  return {
    titulo: movie.titulo,
    diretores: movie.diretores,
    ano_lancamento: movie.ano_lancamento,
    generos: movie.generos,
    sinopse: movie.sinopse ?? '',
    url_poster: movie.url_poster ?? '',
    duracao_minutos: movie.duracao_minutos,
  }
}
