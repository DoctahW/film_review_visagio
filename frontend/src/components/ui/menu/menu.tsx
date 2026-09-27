import { Menu as BaseMenu } from '@base-ui/react/menu'
import type { VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type MenuProps = BaseMenu.Root.Props

export function Menu(props: MenuProps) {
  return <BaseMenu.Root {...props} />
}

export type MenuTriggerProps = Omit<BaseMenu.Trigger.Props, 'className'> &
  VariantProps<typeof buttonVariants> & { className?: string }

/** Botão que abre o menu. Por padrão, ícone fantasma (`⋮`); passe `aria-label` quando só tiver ícone. */
export function MenuTrigger({
  className,
  variant = 'ghost',
  size = 'icon',
  ...props
}: MenuTriggerProps) {
  return (
    <BaseMenu.Trigger
      className={cn(
        buttonVariants({ variant, size }),
        'data-popup-open:bg-surface-raised data-popup-open:text-foreground',
        className,
      )}
      {...props}
    />
  )
}

export type MenuContentProps = {
  children: ReactNode
  side?: BaseMenu.Positioner.Props['side']
  align?: BaseMenu.Positioner.Props['align']
  sideOffset?: number
  className?: string
}

export function MenuContent({
  children,
  side = 'bottom',
  align = 'end',
  sideOffset = 8,
  className,
}: MenuContentProps) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="outline-none"
      >
        <BaseMenu.Popup
          className={cn(
            'max-h-(--available-height) min-w-48 origin-(--transform-origin) overflow-y-auto rounded-control border border-border bg-surface-raised p-1 text-foreground shadow-xl outline-none',
            'transition-[opacity,scale] duration-150 ease-out',
            'data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0',
            className,
          )}
        >
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  )
}

export type MenuItemProps = Omit<BaseMenu.Item.Props, 'className'> & {
  tone?: 'default' | 'danger'
  className?: string
}

export function MenuItem({ className, tone = 'default', ...props }: MenuItemProps) {
  return (
    <BaseMenu.Item
      className={cn(
        'flex min-h-11 cursor-default items-center gap-2.5 rounded-[calc(var(--radius-control)-0.25rem)] px-3 text-sm font-medium outline-none select-none md:min-h-10',
        'data-disabled:pointer-events-none data-disabled:opacity-50',
        '[&_svg]:size-4 [&_svg]:shrink-0',
        tone === 'danger'
          ? 'text-danger data-highlighted:bg-danger/10'
          : 'data-highlighted:bg-surface [&_svg]:text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function MenuSeparator({ className }: { className?: string }) {
  return <BaseMenu.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} />
}
