import { cn } from '@/lib/utils'

export const APP_NAME = 'One More Movie'

export function Brand({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-2.5 text-lg font-bold tracking-tight', className)}
    >
      <img src="/favicon.svg" alt="" width={32} height={32} className="size-8" />
      {APP_NAME}
    </span>
  )
}
