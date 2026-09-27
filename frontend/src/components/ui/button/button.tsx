import { Button as BaseButton } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Classes do botão. Exportadas para estilizar links como botão (`<Link className={buttonVariants()}>`):
 * o Base UI não deve renderizar `<a>` via `render`, pois impõe semântica de botão.
 */
export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-control text-sm font-medium whitespace-nowrap select-none',
    'transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'data-disabled:cursor-not-allowed data-disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:not-data-disabled:bg-primary/90',
        secondary:
          'border border-border bg-surface text-foreground hover:not-data-disabled:bg-surface-raised',
        ghost: 'text-foreground hover:not-data-disabled:bg-surface-raised',
        danger: 'bg-danger text-danger-foreground hover:not-data-disabled:bg-danger/90',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        icon: 'size-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

// `className` só como string: a forma função-do-estado do Base UI não combina com `cn`.
export type ButtonProps = Omit<BaseButton.Props, 'className'> &
  VariantProps<typeof buttonVariants> & { className?: string }

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <BaseButton className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
