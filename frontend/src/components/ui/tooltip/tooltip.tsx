import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
import type { ReactElement, ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Montado uma vez na raiz: tooltips vizinhos abrem sem atraso depois que o primeiro aparece.
 * Opcional; sem ele cada tooltip usa o atraso próprio.
 */
export function TooltipProvider({ children }: { children: ReactNode }) {
  return <BaseTooltip.Provider delay={400}>{children}</BaseTooltip.Provider>
}

export type TooltipProps = {
  label: string
  /**
   * Elemento que recebe o tooltip (deve encaminhar `ref` e props, como `Button`).
   * O tooltip é só visual: o gatilho continua precisando de nome acessível (`aria-label`).
   */
  children: ReactElement
  side?: BaseTooltip.Positioner.Props['side']
  className?: string
}

export function Tooltip({ label, children, side = 'top', className }: TooltipProps) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={8}>
          <BaseTooltip.Popup
            className={cn(
              'origin-(--transform-origin) rounded-control border border-border bg-surface-raised px-2.5 py-1.5 text-xs font-medium text-foreground shadow-xl',
              'transition-[opacity,scale] duration-150 ease-out',
              'data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0',
              'data-instant:transition-none',
              className,
            )}
          >
            {label}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  )
}
