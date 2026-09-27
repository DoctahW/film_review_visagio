import { useStore } from '@tanstack/react-form'
import { useId, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input, Textarea } from '@/components/ui/input'
import { NumberInput } from '@/components/ui/number-input'
import { Select, type SelectItem } from '@/components/ui/select'
import { StarRating } from '@/components/ui/star-rating'
import { TagsInput } from '@/components/ui/tags-input'
import { formatInteger } from '@/lib/format'
import { cn } from '@/lib/utils'

import { useFieldError } from './field-error'
import { useFieldContext } from './form-context'

type FieldFrameProps = {
  label: string
  description?: string
  error: string | undefined
  children: ReactNode
  /** Controles que não são `<input>` (select, estrelas) usam rótulo `<div>`, como pede o Base UI. */
  labelId?: string
  nonNativeLabel?: boolean
  /** Conteúdo à direita da descrição (contador de caracteres). */
  aside?: ReactNode
}

/** Estrutura comum: rótulo, controle, descrição e erro, ligados pelo `Field` do Base UI. */
function FieldFrame({
  label,
  description,
  error,
  children,
  labelId,
  nonNativeLabel,
  aside,
}: FieldFrameProps) {
  const field = useFieldContext<unknown>()
  const isTouched = useStore(field.store, (state) => state.meta.isTouched)
  const isDirty = useStore(field.store, (state) => state.meta.isDirty)

  return (
    <Field name={field.name} invalid={error !== undefined} touched={isTouched} dirty={isDirty}>
      {nonNativeLabel ? (
        <FieldLabel id={labelId} nativeLabel={false} render={<div />}>
          {label}
        </FieldLabel>
      ) : (
        <FieldLabel id={labelId}>{label}</FieldLabel>
      )}
      {children}
      {(description || aside) && (
        <div className="flex items-start justify-between gap-3">
          {description && <FieldDescription>{description}</FieldDescription>}
          {aside}
        </div>
      )}
      <FieldError match={error !== undefined}>{error}</FieldError>
    </Field>
  )
}

export type TextFieldProps = {
  label: string
  description?: string
  placeholder?: string
  type?: 'text' | 'url'
  autoComplete?: string
}

export function TextField({
  label,
  description,
  placeholder,
  type = 'text',
  autoComplete,
}: TextFieldProps) {
  const field = useFieldContext<string>()
  const error = useFieldError()

  return (
    <FieldFrame label={label} description={description} error={error}>
      <Input
        type={type}
        value={field.state.value}
        onValueChange={field.handleChange}
        onBlur={field.handleBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </FieldFrame>
  )
}

export type TextareaFieldProps = {
  label: string
  description?: string
  placeholder?: string
  rows?: number
  /** Limite de caracteres; mostra o contador "N/max". */
  maxLength?: number
}

export function TextareaField({
  label,
  description,
  placeholder,
  rows,
  maxLength,
}: TextareaFieldProps) {
  const field = useFieldContext<string>()
  const error = useFieldError()
  const length = field.state.value.length

  return (
    <FieldFrame
      label={label}
      description={description}
      error={error}
      aside={
        maxLength !== undefined && (
          <span
            className={cn(
              'ml-auto shrink-0 text-sm text-subtle-foreground tabular-nums',
              length > maxLength && 'text-danger',
            )}
          >
            {formatInteger(length)}/{formatInteger(maxLength)}
          </span>
        )
      }
    >
      <Textarea
        value={field.state.value}
        onValueChange={field.handleChange}
        onBlur={field.handleBlur}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
      />
    </FieldFrame>
  )
}

export type NumberFieldProps = {
  label: string
  description?: string
  placeholder?: string
  min?: number
  max?: number
}

export function NumberField({ label, description, placeholder, min, max }: NumberFieldProps) {
  const field = useFieldContext<number | null>()
  const error = useFieldError()

  return (
    <FieldFrame label={label} description={description} error={error}>
      <NumberInput
        value={field.state.value}
        onValueChange={field.handleChange}
        onBlur={field.handleBlur}
        placeholder={placeholder}
        min={min}
        max={max}
      />
    </FieldFrame>
  )
}

export type TagsFieldProps = {
  label: string
  description?: string
  placeholder?: string
  suggestions?: string[]
  allowCreate?: boolean
}

export function TagsField({
  label,
  description,
  placeholder,
  suggestions,
  allowCreate,
}: TagsFieldProps) {
  const field = useFieldContext<string[]>()
  const error = useFieldError()

  return (
    <FieldFrame label={label} description={description} error={error}>
      <TagsInput
        value={field.state.value}
        onValueChange={field.handleChange}
        onBlur={field.handleBlur}
        placeholder={placeholder}
        suggestions={suggestions}
        allowCreate={allowCreate}
      />
    </FieldFrame>
  )
}

export type SelectFieldProps<T extends string> = {
  label: string
  items: SelectItem<T>[]
  placeholder?: string
  description?: string
}

export function SelectField<T extends string>({
  label,
  items,
  placeholder,
  description,
}: SelectFieldProps<T>) {
  const field = useFieldContext<T | null>()
  const error = useFieldError()

  return (
    <FieldFrame label={label} description={description} error={error} nonNativeLabel>
      <Select
        items={items}
        value={field.state.value}
        onValueChange={field.handleChange}
        onBlur={field.handleBlur}
        placeholder={placeholder}
      />
    </FieldFrame>
  )
}

export type RatingFieldProps = {
  label: string
  description?: string
}

/** Nota de 0 a 10 em meias estrelas. Zero só pelo teclado ou pelo botão "Zerar". */
export function RatingField({ label, description }: RatingFieldProps) {
  const field = useFieldContext<number | null>()
  const error = useFieldError()
  const labelId = useId()

  return (
    <FieldFrame
      label={label}
      description={description}
      error={error}
      labelId={labelId}
      nonNativeLabel
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <StarRating
          size="lg"
          // As 10 estrelas lg ocupam ~316px: em telas estreitas a nota quebra para baixo
          // em vez de vazar do card.
          className="max-w-full flex-wrap gap-y-1"
          value={field.state.value}
          onChange={field.handleChange}
          onBlur={field.handleBlur}
          aria-labelledby={labelId}
        />
        <Button
          variant="ghost"
          size="sm"
          disabled={field.state.value === 0}
          onClick={() => field.handleChange(0)}
        >
          Zerar
        </Button>
      </div>
    </FieldFrame>
  )
}
