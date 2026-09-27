import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export type SkeletonProps = Omit<ComponentProps<'div'>, 'className'> & { className?: string }

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-control bg-surface-raised', className)}
      {...props}
    />
  )
}
