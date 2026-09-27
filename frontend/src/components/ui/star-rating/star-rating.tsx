import { Star } from 'lucide-react'
import { useState, type FocusEventHandler, type KeyboardEvent, type MouseEvent } from 'react'

import { formatRating } from '@/lib/format'
import { cn } from '@/lib/utils'

const MAX = 10
const STEP = 0.5
const STARS = Array.from({ length: MAX }, (_, index) => index + 1)

const sizes = {
  sm: { star: 'size-3.5', gap: 'gap-0.5', value: 'text-xs' },
  md: { star: 'size-5', gap: 'gap-0.5', value: 'text-sm' },
  lg: { star: 'size-7', gap: 'gap-1', value: 'text-lg' },
} as const

export interface StarRatingProps {
  value: number | null
  onChange?: (nota: number) => void
  size?: keyof typeof sizes
  showValue?: boolean
  className?: string
  id?: string
  'aria-labelledby'?: string
  onBlur?: FocusEventHandler<HTMLDivElement>
}

/** Percentual preenchido da estrela `index` (1..10) para a nota `value`. */
function fillPercent(value: number, index: number): number {
  return Math.round(Math.min(1, Math.max(0, value - (index - 1))) * 100)
}

export function StarRating({
  value,
  onChange,
  size = 'md',
  showValue = true,
  className,
  id,
  'aria-labelledby': ariaLabelledBy,
  onBlur,
}: StarRatingProps) {
  const [preview, setPreview] = useState<number | null>(null)
  const classes = sizes[size]
  const interactive = onChange !== undefined
  const shown = interactive ? (preview ?? value) : value

  const stars = STARS.map((index) => (
    <span
      key={index}
      data-star={index}
      className={cn('relative block shrink-0', interactive && 'cursor-pointer')}
      onPointerMove={interactive ? (event) => setPreview(pointerValue(event, index)) : undefined}
      onClick={interactive ? (event) => onChange(pointerValue(event, index)) : undefined}
    >
      <Star aria-hidden className={cn(classes.star, 'fill-current text-rating-empty')} />
      <span
        data-star-fill
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${fillPercent(shown ?? 0, index)}%` }}
      >
        <Star aria-hidden className={cn(classes.star, 'fill-current text-rating')} />
      </span>
    </span>
  ))

  const number = showValue && (
    <span
      aria-hidden
      className={cn(
        'min-w-[2.5em] font-semibold text-foreground tabular-nums',
        shown === null && 'text-subtle-foreground',
        classes.value,
      )}
    >
      {formatRating(shown)}
    </span>
  )

  if (!interactive) {
    return (
      <div
        id={id}
        role="img"
        aria-label={value === null ? 'Sem avaliações' : `Nota ${formatRating(value)} de ${MAX}`}
        aria-labelledby={ariaLabelledBy}
        className={cn('inline-flex items-center gap-2', className)}
      >
        <span className={cn('flex items-center', classes.gap)}>{stars}</span>
        {number}
      </div>
    )
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = value ?? 0
    const next = (() => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          return current + STEP
        case 'ArrowLeft':
        case 'ArrowDown':
          return current - STEP
        case 'PageUp':
          return current + 1
        case 'PageDown':
          return current - 1
        case 'Home':
          return 0
        case 'End':
          return MAX
        default:
          return undefined
      }
    })()
    if (next === undefined) return
    event.preventDefault()
    setPreview(null)
    const clamped = Math.min(MAX, Math.max(0, next))
    if (clamped !== value) onChange?.(clamped)
  }

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div
        id={id}
        role="slider"
        tabIndex={0}
        aria-labelledby={ariaLabelledBy}
        aria-valuemin={0}
        aria-valuemax={MAX}
        aria-valuenow={value ?? 0}
        aria-valuetext={value === null ? 'Sem nota' : `${formatRating(value)} de ${MAX}`}
        className={cn(
          'flex touch-manipulation items-center rounded-control select-none',
          'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          classes.gap,
        )}
        onKeyDown={handleKeyDown}
        onPointerLeave={() => setPreview(null)}
        onBlur={onBlur}
      >
        {stars}
      </div>
      {number}
    </div>
  )
}

/** Metade esquerda da estrela `index` vale `index - 0,5`; a direita, `index`. */
function pointerValue(event: MouseEvent<HTMLElement>, index: number): number {
  const rect = event.currentTarget.getBoundingClientRect()
  return event.clientX - rect.left < rect.width / 2 ? index - STEP : index
}
