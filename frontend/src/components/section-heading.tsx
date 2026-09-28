import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type SectionHeadingProps = {
  children: ReactNode
  action?: ReactNode
  id?: string
  className?: string
}

/** Título de seção usado em todas as páginas. */
export function SectionHeading({ children, action, id, className }: SectionHeadingProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <h2 id={id} className="text-lg font-bold tracking-tight md:text-xl">
        {children}
      </h2>
      {action}
    </div>
  )
}
