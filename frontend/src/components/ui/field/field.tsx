import { Field as BaseField } from '@base-ui/react/field'

import { cn } from '@/lib/utils'

// `className` só como string: a forma função-do-estado do Base UI não combina com `cn`.
// `invalid` vem do Base UI: passe-o quando o estado de erro é externo (TanStack Form, API).
export type FieldProps = Omit<BaseField.Root.Props, 'className'> & { className?: string }

export function Field({ className, ...props }: FieldProps) {
  return <BaseField.Root className={cn('flex flex-col gap-1.5', className)} {...props} />
}

export type FieldLabelProps = Omit<BaseField.Label.Props, 'className'> & { className?: string }

export function FieldLabel({ className, ...props }: FieldLabelProps) {
  return (
    <BaseField.Label
      className={cn(
        'text-sm font-medium text-foreground data-disabled:text-subtle-foreground',
        className,
      )}
      {...props}
    />
  )
}

export type FieldDescriptionProps = Omit<BaseField.Description.Props, 'className'> & {
  className?: string
}

export function FieldDescription({ className, ...props }: FieldDescriptionProps) {
  return (
    <BaseField.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
}

export type FieldErrorProps = Omit<BaseField.Error.Props, 'className'> & { className?: string }

/** `match={true}` deixa a visibilidade com quem controla a validação (TanStack Form, API). */
export function FieldError({ className, ...props }: FieldErrorProps) {
  return <BaseField.Error className={cn('text-sm text-danger', className)} {...props} />
}
