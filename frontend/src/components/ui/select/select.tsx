import { Select as BaseSelect } from '@base-ui/react/select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { FocusEventHandler } from 'react'

import { controlSurfaceClasses } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type SelectItem<T extends string> = { value: T; label: string }

export type SelectProps<T extends string> = {
  items: SelectItem<T>[]
  value: T | null
  onValueChange: (value: T | null) => void
  placeholder?: string
  'aria-label'?: string
  id?: string
  className?: string
  name?: string
  disabled?: boolean
  onBlur?: FocusEventHandler<HTMLButtonElement>
  /**
   * Primeira opção da lista que representa "nenhum valor" (`null`), ex.: "Todos os gêneros".
   * Sem ela, o `placeholder` aparece no gatilho e o valor não pode ser limpo pela lista.
   */
  nullLabel?: string
}

const scrollArrowClasses =
  'flex h-6 w-full cursor-default items-center justify-center bg-surface-raised text-muted-foreground'

export function Select<T extends string>({
  items,
  value,
  onValueChange,
  placeholder,
  'aria-label': ariaLabel,
  id,
  className,
  name,
  disabled,
  onBlur,
  nullLabel,
}: SelectProps<T>) {
  const options: { value: T | null; label: string }[] =
    nullLabel === undefined ? items : [{ value: null, label: nullLabel }, ...items]

  return (
    <BaseSelect.Root
      id={id}
      name={name}
      items={options}
      value={value}
      onValueChange={(next) => onValueChange(next)}
      disabled={disabled}
    >
      <BaseSelect.Trigger
        aria-label={ariaLabel}
        onBlur={onBlur}
        className={cn(
          controlSurfaceClasses,
          'group flex h-11 cursor-default items-center justify-between gap-2 px-4 text-left select-none',
          'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'data-popup-open:border-border',
          className,
        )}
      >
        <BaseSelect.Value
          placeholder={placeholder}
          // Com `nullLabel`, "nenhum valor" é uma opção de verdade, não um placeholder apagado.
          className={cn(
            'truncate',
            nullLabel === undefined && 'data-placeholder:text-subtle-foreground',
          )}
        />
        <BaseSelect.Icon className="shrink-0 text-muted-foreground transition-transform duration-150 group-data-popup-open:rotate-180">
          <ChevronDown aria-hidden className="size-4" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner
          alignItemWithTrigger={false}
          sideOffset={6}
          className="z-50 outline-none select-none"
        >
          <BaseSelect.Popup
            className={cn(
              'relative min-w-(--anchor-width) origin-(--transform-origin) overflow-hidden rounded-control border border-border bg-surface-raised text-sm text-foreground shadow-xl outline-none',
              'transition-[opacity,scale,translate] duration-150 ease-out',
              'data-starting-style:-translate-y-1 data-starting-style:scale-[0.98] data-starting-style:opacity-0',
              'data-ending-style:-translate-y-1 data-ending-style:scale-[0.98] data-ending-style:opacity-0',
            )}
          >
            <BaseSelect.ScrollUpArrow className={cn(scrollArrowClasses, 'top-0')}>
              <ChevronUp aria-hidden className="size-4" />
            </BaseSelect.ScrollUpArrow>
            <BaseSelect.List className="max-h-[min(var(--available-height),20rem)] scroll-py-6 overflow-y-auto p-1">
              {options.map((item) => (
                <BaseSelect.Item
                  key={item.value ?? ''}
                  value={item.value}
                  className={cn(
                    'grid cursor-default grid-cols-[1rem_1fr] items-center gap-2.5 rounded-lg py-2.5 pr-4 pl-3 outline-none select-none',
                    'text-muted-foreground data-highlighted:bg-surface data-highlighted:text-foreground data-selected:text-foreground',
                  )}
                >
                  <BaseSelect.ItemIndicator className="col-start-1 text-primary">
                    <Check aria-hidden className="size-4" />
                  </BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText className="col-start-2">{item.label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
            <BaseSelect.ScrollDownArrow className={cn(scrollArrowClasses, 'bottom-0')}>
              <ChevronDown aria-hidden className="size-4" />
            </BaseSelect.ScrollDownArrow>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  )
}
