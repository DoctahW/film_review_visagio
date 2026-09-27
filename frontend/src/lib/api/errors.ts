import { zHttpValidationError } from './generated/zod.gen'

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown) {
    super(messageOf(status, body))
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }

  /**
   * Erros de validação do FastAPI (422) por campo do corpo/query: `{ titulo: "..." }`.
   * Itens de lista (`["body", "diretores", 0]`) caem no campo da lista.
   */
  get fieldErrors(): Record<string, string> {
    if (this.status !== 422) return {}
    const parsed = zHttpValidationError.safeParse(this.body)
    if (!parsed.success) return {}

    const errors: Record<string, string> = {}
    for (const { loc, msg } of parsed.data.detail ?? []) {
      const field = loc[1]
      if (typeof field === 'string') errors[field] ??= msg
    }
    return errors
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

function messageOf(status: number, body: unknown): string {
  if (typeof body === 'object' && body !== null && 'detail' in body) {
    const { detail } = body
    if (typeof detail === 'string') return detail
  }
  return `Erro ${status} na API`
}
