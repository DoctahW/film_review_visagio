import { useStore } from '@tanstack/react-form'

import { useFieldContext } from './form-context'

function firstErrorMessage(errors: readonly unknown[]): string | undefined {
  for (const error of errors.flat()) {
    if (typeof error === 'string' && error !== '') return error
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const { message } = error
      if (typeof message === 'string' && message !== '') return message
    }
  }
  return undefined
}

/** Erro visível do campo atual: só depois que o campo foi tocado ou houve tentativa de envio. */
export function useFieldError(): string | undefined {
  const field = useFieldContext<unknown>()
  const errors = useStore(field.store, (state) => state.meta.errors)
  const touched = useStore(field.store, (state) => state.meta.isTouched)
  const submitted = useStore(field.form.store, (state) => state.submissionAttempts > 0)
  return touched || submitted ? firstErrorMessage(errors) : undefined
}
