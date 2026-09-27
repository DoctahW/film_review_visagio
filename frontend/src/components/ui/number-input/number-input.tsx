import { NumberField } from '@base-ui/react/number-field'
import { Minus, Plus } from 'lucide-react'
import type { FocusEventHandler } from 'react'

import { controlSurfaceClasses } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const stepperClasses = cn(
  'flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground select-none',
  'transition-colors hover:not-data-disabled:bg-surface-raised hover:not-data-disabled:text-foreground',
  'data-disabled:cursor-not-allowed data-disabled:opacity-40',
)

export type NumberInputProps = {
  value: number | null
  onValueChange: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  id?: string
  name?: string
  'aria-label'?: string
  className?: string
  onBlur?: FocusEventHandler<HTMLInputElement>
  disabled?: boolean
  steppers?: boolean
  /** Formatação pt-BR; o padrão tira o separador de milhar (anos: 2024, não 2.024). */
  format?: Intl.NumberFormatOptions
}

const DEFAULT_FORMAT: Intl.NumberFormatOptions = { useGrouping: false }

export function NumberInput({
  value,
  onValueChange,
  min,
  max,
  step,
  placeholder,
  id,
  name,
  'aria-label': ariaLabel,
  className,
  onBlur,
  disabled,
  steppers = false,
  format = DEFAULT_FORMAT,
}: NumberInputProps) {
  return (
    <NumberField.Root
      id={id}
      name={name}
      value={value}
      onValueChange={(next) => onValueChange(next)}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      locale="pt-BR"
      format={format}
      className={cn('w-full', className)}
    >
      <NumberField.Group
        className={cn(
          controlSurfaceClasses,
          'flex h-11 items-center gap-1 pr-1.5',
          'has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring has-[input:focus-visible]:ring-offset-2 has-[input:focus-visible]:ring-offset-background',
          'data-invalid:has-[input:focus-visible]:ring-danger',
        )}
      >
        <NumberField.Input
          aria-label={ariaLabel}
          placeholder={placeholder}
          onBlur={onBlur}
          className="h-full min-w-0 flex-1 bg-transparent pl-4 tabular-nums outline-none placeholder:text-subtle-foreground"
        />
        {steppers && (
          <>
            <NumberField.Decrement aria-label="Diminuir" className={stepperClasses}>
              <Minus aria-hidden className="size-4" />
            </NumberField.Decrement>
            <NumberField.Increment aria-label="Aumentar" className={stepperClasses}>
              <Plus aria-hidden className="size-4" />
            </NumberField.Increment>
          </>
        )}
      </NumberField.Group>
    </NumberField.Root>
  )
}
