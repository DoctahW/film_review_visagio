import { AlertDialog } from '@base-ui/react/alert-dialog'
import { LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** Não fecha o diálogo: quem chama fecha (`onOpenChange(false)`) quando a ação dá certo. */
  onConfirm: () => void
  /** Enquanto `true`, os botões ficam desabilitados e o diálogo não fecha (Esc, clique fora, Cancelar). */
  pending?: boolean
  tone?: 'danger' | 'default'
  className?: string
}

/**
 * Confirmação de ação (excluir, descartar). Controlado: sempre recebe `open`/`onOpenChange`.
 * No celular encosta embaixo como folha; a partir de `sm` fica centralizado.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  pending = false,
  tone = 'danger',
  className,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        // Fechar no meio da requisição esconderia o erro ou o resultado dela.
        if (!next && pending) return
        onOpenChange(next)
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 min-h-dvh bg-black/60 backdrop-blur-sm transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-[-webkit-touch-callout:none]:absolute" />
        <AlertDialog.Viewport className="fixed inset-0 flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
          <AlertDialog.Popup
            className={cn(
              'flex w-full max-w-md flex-col gap-6 rounded-card border border-border bg-surface p-6 text-foreground shadow-xl outline-none',
              'transition-[opacity,translate,scale] duration-150 ease-out',
              'data-ending-style:translate-y-4 data-ending-style:opacity-0 data-starting-style:translate-y-4 data-starting-style:opacity-0',
              'sm:data-ending-style:translate-y-0 sm:data-ending-style:scale-95 sm:data-starting-style:translate-y-0 sm:data-starting-style:scale-95',
              className,
            )}
          >
            <div className="flex flex-col gap-2">
              <AlertDialog.Title className="text-lg font-bold tracking-tight">
                {title}
              </AlertDialog.Title>
              {description != null && (
                <AlertDialog.Description className="text-sm text-muted-foreground">
                  {description}
                </AlertDialog.Description>
              )}
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <AlertDialog.Close
                disabled={pending}
                render={<Button variant="secondary" className="w-full sm:w-auto" />}
              >
                {cancelLabel}
              </AlertDialog.Close>
              <Button
                variant={tone === 'danger' ? 'danger' : 'primary'}
                className="w-full sm:w-auto"
                disabled={pending}
                // Mantém o foco no botão enquanto a ação roda.
                focusableWhenDisabled
                aria-busy={pending || undefined}
                onClick={onConfirm}
              >
                {pending && <LoaderCircle aria-hidden className="animate-spin" />}
                {confirmLabel}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
