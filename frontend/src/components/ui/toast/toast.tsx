import { Toast, type ToastManager } from '@base-ui/react/toast'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { createContext, use, useMemo, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type ToastApi = {
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
}

// Guarda só o manager (estável): quem dispara toast não re-renderiza a cada toast novo,
// ao contrário de `Toast.useToastManager`, que assina a lista.
const ToastManagerContext = createContext<ToastManager | null>(null)

/**
 * Envolve a app e renderiza a pilha de toasts: centralizada embaixo no celular (acima da
 * navegação inferior de 64px) e no canto inferior direito a partir de `md`.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [manager] = useState(Toast.createToastManager)

  return (
    <ToastManagerContext value={manager}>
      <Toast.Provider toastManager={manager}>
        {children}
        <Toast.Portal>
          <Toast.Viewport className="fixed bottom-20 left-1/2 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 md:right-6 md:bottom-6 md:left-auto md:w-90 md:translate-x-0">
            <ToastList />
          </Toast.Viewport>
        </Toast.Portal>
      </Toast.Provider>
    </ToastManagerContext>
  )
}

export function useToast(): ToastApi {
  const manager = use(ToastManagerContext)
  if (!manager) throw new Error('useToast precisa estar dentro de <ToastProvider>.')

  return useMemo(
    () => ({
      success: (title, description) => {
        manager.add({ type: 'success', title, description })
      },
      error: (title, description) => {
        manager.add({ type: 'error', title, description, priority: 'high' })
      },
    }),
    [manager],
  )
}

// Empilhamento e gestos seguem a demo do Base UI: `--toast-index` escala e desloca os de trás,
// `data-expanded` (hover/foco no viewport) abre a pilha usando `--toast-offset-y`.
const rootClasses = cn(
  '[--gap:0.75rem] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]',
  '[--height:var(--toast-frontmost-height,var(--toast-height))]',
  '[--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))]',
  'absolute right-0 bottom-0 left-0 z-[calc(1000-var(--toast-index))] h-(--height) w-full origin-bottom select-none',
  'rounded-control border border-border bg-surface-raised text-foreground shadow-xl',
  '[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))]',
  '[transition:transform_0.5s_cubic-bezier(0.22,1,0.36,1),opacity_0.5s,height_0.15s]',
  // Faixa invisível entre toasts para o hover não "cair" no vão e recolher a pilha.
  "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
  'data-expanded:h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]',
  'data-ending-style:opacity-0 data-limited:opacity-0',
  'data-starting-style:[transform:translateY(150%)]',
  '[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:[transform:translateY(150%)]',
  'data-ending-style:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))]',
  'data-ending-style:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]',
  'data-ending-style:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]',
  'data-ending-style:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))]',
)

const icons = {
  success: <CircleCheck aria-hidden className="size-5 shrink-0 text-primary" />,
  error: <CircleAlert aria-hidden className="size-5 shrink-0 text-danger" />,
} as const

function ToastList() {
  const { toasts } = Toast.useToastManager()

  return toasts.map((toast) => (
    <Toast.Root key={toast.id} toast={toast} className={rootClasses}>
      <Toast.Content className="flex items-start gap-3 overflow-hidden p-4 transition-opacity duration-250 data-behind:opacity-0 data-expanded:opacity-100">
        {icons[toast.type as keyof typeof icons]}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Toast.Title className="text-sm font-semibold" />
          <Toast.Description className="text-sm text-muted-foreground" />
        </div>
        <Toast.Close
          aria-label="Fechar"
          className="-my-1 -mr-1 flex size-7 shrink-0 items-center justify-center rounded-full text-subtle-foreground transition-colors outline-none hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X aria-hidden className="size-4" />
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ))
}
