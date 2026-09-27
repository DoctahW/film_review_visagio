import { useStore } from '@tanstack/react-form'
import { LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'

import { useFormContext } from './form-context'

export type SubmitButtonProps = {
  children: ReactNode
  /** Texto enquanto envia (ex.: "Salvando…"); sem ele, mantém `children`. */
  pendingLabel?: ReactNode
  className?: string
}

export function SubmitButton({ children, pendingLabel, className }: SubmitButtonProps) {
  const form = useFormContext()
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting)

  return (
    <Button type="submit" disabled={isSubmitting} className={className}>
      {isSubmitting && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
      {isSubmitting ? (pendingLabel ?? children) : children}
    </Button>
  )
}
