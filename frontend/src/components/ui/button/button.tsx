import { Button as BaseButton } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Classes do botão. Exportadas para estilizar links como botão (`<Link className={buttonVariants()}>`):
 * o Base UI não deve renderizar `<a>` via `render`, pois impõe semântica de botão.
 */
export const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-semibold whitespace-nowrap select-none',
    'transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'data-disabled:cursor-not-allowed data-disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:not-data-disabled:bg-primary/90',
        secondary: 'bg-surface-raised text-foreground hover:not-data-disabled:bg-border',
        ghost:
          'text-muted-foreground hover:not-data-disabled:bg-surface-raised hover:not-data-disabled:text-foreground',
        danger: 'bg-danger text-danger-foreground hover:not-data-disabled:bg-danger/90',
        glass: 'bg-black/40 text-white backdrop-blur-md hover:not-data-disabled:bg-black/55',
      },
      size: {
        sm: 'h-9 px-4',
        md: 'h-11 px-5',
        lg: 'h-12 px-7 text-base',
        icon: 'size-11',
        'icon-sm': 'size-9',
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
