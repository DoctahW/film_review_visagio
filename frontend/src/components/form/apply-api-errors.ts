import type { AnyFormApi } from '@tanstack/react-form'

import { isApiError } from '@/lib/api'

const FALLBACK_MESSAGE = 'Não foi possível salvar. Tente novamente.'

/**
 * Leva os erros por campo de um `ApiError` (422) para os campos do formulário.
 * Devolve `null` quando todos os erros encontraram um campo; senão, uma mensagem para exibir
 * no topo do formulário (toast/alerta).
 *
 * Os erros entram em `errorMap.onServer` com origem "form": a próxima validação do formulário
 * (edição do campo ou novo envio) os limpa.
 */
export function applyApiErrors(form: AnyFormApi, error: unknown): string | null {
  if (!isApiError(error)) return FALLBACK_MESSAGE

  const fieldErrors = Object.entries(error.fieldErrors)
  if (fieldErrors.length === 0) return error.message || FALLBACK_MESSAGE

  let allMapped = true
  for (const [name, message] of fieldErrors) {
    if (!(name in form.fieldInfo)) {
      allMapped = false
      continue
    }
    form.setFieldMeta(name, (prev) => ({
      ...prev,
      errorMap: { ...prev.errorMap, onServer: message },
      errorSourceMap: { ...prev.errorSourceMap, onServer: 'form' },
    }))
  }
  return allMapped ? null : FALLBACK_MESSAGE
}
