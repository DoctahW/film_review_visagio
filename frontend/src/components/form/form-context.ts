import { createFormHookContexts } from '@tanstack/react-form'

// Contextos que ligam `form.AppField`/`form.AppForm` aos componentes do kit.
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()
