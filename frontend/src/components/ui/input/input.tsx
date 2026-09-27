import { Input as BaseInput } from '@base-ui/react/input'

import { cn } from '@/lib/utils'

/**
 * Superfície dos controles de texto (input, textarea, number, tags). Exportada para os primitivos
 * que desenham a própria caixa em volta de um input interno.
 * Inválido quando dentro de um `Field` inválido (`data-invalid`) ou com `aria-invalid` direto.
 */
export const controlSurfaceClasses = cn(
  'w-full rounded-control border border-transparent bg-surface text-sm text-foreground any-pointer-coarse:text-base',
  'transition-[border-color,box-shadow] hover:not-data-disabled:border-border',
  'data-disabled:cursor-not-allowed data-disabled:opacity-50',
  'aria-invalid:ring-2 aria-invalid:ring-danger data-invalid:ring-2 data-invalid:ring-danger',
)

const focusRingClasses =
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-invalid:focus-visible:ring-danger aria-invalid:focus-visible:ring-danger'

const textControlClasses = cn(
  controlSurfaceClasses,
  focusRingClasses,
  'px-4 placeholder:text-subtle-foreground',
)

// `className` só como string: a forma função-do-estado do Base UI não combina com `cn`.
export type InputProps = Omit<BaseInput.Props, 'className'> & { className?: string }

export function Input({ className, ...props }: InputProps) {
  return <BaseInput className={cn(textControlClasses, 'h-11', className)} {...props} />
}

export type TextareaProps = Omit<BaseInput.Props, 'className' | 'render'> & {
  className?: string
  rows?: number
}

/** Textarea com o mesmo comportamento do `Input` (integra com `Field`): o Base UI renderiza `<textarea>`. */
export function Textarea({ className, rows, ...props }: TextareaProps) {
  return (
    <BaseInput
      render={<textarea rows={rows} />}
      className={cn(textControlClasses, 'min-h-32 resize-y py-3 leading-relaxed', className)}
      {...props}
    />
  )
}
