import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export const badgeVariants = cva(
  [
    'inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap',
    "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  ],
  {
    variants: {
      variant: {
        neutral: 'bg-surface-raised text-muted-foreground',
        outline: 'border border-border text-muted-foreground',
        accent: 'bg-primary/15 text-primary',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
)

export type BadgeProps = Omit<ComponentProps<'span'>, 'className'> &
  VariantProps<typeof badgeVariants> & { className?: string }

/** Rótulo curto (gênero, ano, duração). Sem equivalente no Base UI: é só um `<span>`. */
export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
