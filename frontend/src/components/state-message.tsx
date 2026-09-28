import { CircleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type StateMessageProps = {
  icon: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

/** Bloco centralizado para estados vazios e de erro. */
export function StateMessage({
  icon: Icon,
  title,
  description,
  action,
  className,
}: StateMessageProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-card bg-surface px-6 py-12 text-center',
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-raised">
        <Icon aria-hidden className="size-6 text-muted-foreground" />
      </span>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="font-semibold">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

type ErrorStateProps = {
  title?: string
  error: unknown
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Algo deu errado',
  error,
  onRetry,
  className,
}: ErrorStateProps) {
  const message = error instanceof Error ? error.message : 'Tente novamente em instantes.'
  return (
    <StateMessage
      icon={CircleAlert}
      title={title}
      description={message}
      className={className}
      action={
        onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Tentar de novo
          </Button>
        )
      }
    />
  )
}
