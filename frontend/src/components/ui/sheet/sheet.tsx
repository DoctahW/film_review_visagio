import { Drawer } from '@base-ui/react/drawer'
import { X } from 'lucide-react'
import { type ReactElement, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

export type SheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  /** Ações fixas no rodapé (ex.: "Limpar" e "Ver resultados"); dividem a largura por igual. */
  footer?: ReactNode
  /** Elemento que abre a folha (deve encaminhar `ref` e props, como `Button`). */
  trigger?: ReactElement
  className?: string
}

// Transição do Base UI Drawer: segue o dedo pelas variáveis de swipe e usa
// `--drawer-swipe-strength` para encurtar o fechamento quando o gesto é rápido.
const motion =
  'transition-transform duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:select-none data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]'

const layouts = {
  bottom: {
    viewport: 'items-end justify-center',
    popup: cn(
      'max-h-[85dvh] w-full rounded-t-card border-t pb-[env(safe-area-inset-bottom)]',
      '[transform:translateY(var(--drawer-swipe-movement-y))]',
      'data-ending-style:[transform:translateY(100%)] data-starting-style:[transform:translateY(100%)]',
    ),
  },
  side: {
    viewport: 'items-stretch justify-end',
    popup: cn(
      'h-full w-full max-w-md rounded-l-card border-l',
      '[transform:translateX(var(--drawer-swipe-movement-x))]',
      'data-ending-style:[transform:translateX(100%)] data-starting-style:[transform:translateX(100%)]',
    ),
  },
}

/**
 * Painel sobre Base UI Drawer: folha inferior no celular (arrastar para baixo fecha) e
 * painel lateral direito a partir de `md` (arrastar para a direita fecha).
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  trigger,
  className,
}: SheetProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const layout = isDesktop ? layouts.side : layouts.bottom

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection={isDesktop ? 'right' : 'down'}
    >
      {trigger && <Drawer.Trigger render={trigger} />}
      {/* Mantém o campo focado visível quando o teclado virtual abre na folha inferior. */}
      <Drawer.VirtualKeyboardProvider>
        <Drawer.Portal>
          <Drawer.Backdrop
            className={cn(
              'fixed inset-0 min-h-dvh bg-black/60 opacity-[calc(1-var(--drawer-swipe-progress))] backdrop-blur-sm',
              'transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0',
              'data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:opacity-0',
              'supports-[-webkit-touch-callout:none]:absolute',
            )}
          />
          <Drawer.Viewport className={cn('fixed inset-0 flex', layout.viewport)}>
            <Drawer.Popup
              className={cn(
                'flex flex-col border-border bg-surface text-foreground shadow-xl outline-none',
                motion,
                layout.popup,
                className,
              )}
            >
              {!isDesktop && (
                <div
                  aria-hidden
                  className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-border"
                />
              )}
              <div className="flex shrink-0 items-start gap-3 px-6 pt-4 pb-4 md:pt-6">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Drawer.Title className="text-xl font-bold tracking-tight">{title}</Drawer.Title>
                  {description && (
                    <Drawer.Description className="text-sm text-muted-foreground">
                      {description}
                    </Drawer.Description>
                  )}
                </div>
                <Drawer.Close
                  aria-label="Fechar"
                  render={<Button variant="ghost" size="icon-sm" className="-mt-1 -mr-2" />}
                >
                  <X aria-hidden className="size-5" />
                </Drawer.Close>
              </div>
              <Drawer.Content className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6">
                {children}
              </Drawer.Content>
              {footer && (
                <div className="flex shrink-0 gap-3 border-t border-border px-6 py-4 *:flex-1">
                  {footer}
                </div>
              )}
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.VirtualKeyboardProvider>
    </Drawer.Root>
  )
}
