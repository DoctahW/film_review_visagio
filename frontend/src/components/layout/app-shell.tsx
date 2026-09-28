import { Link, type LinkProps } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Brand } from '@/components/brand'
import { cn } from '@/lib/utils'

/**
 * Largura e respiro lateral em todas as páginas: 72rem (1152px) até telas de 1080p, depois 60% da
 * largura da tela (1536px em 1440p), com teto de 100rem (1600px).
 */
export const pageContainer = 'mx-auto w-full max-w-[clamp(72rem,60vw,100rem)] px-4 md:px-8'

export type NavItem = {
  to: NonNullable<LinkProps['to']>
  label: string
  icon: LucideIcon
  /** Ativo só na rota exata (ex.: "/" não deve acender em "/filmes"). */
  exact?: boolean
}

type AppShellProps = {
  homeTo: NonNullable<LinkProps['to']>
  badge?: ReactNode
  items: NavItem[]
  mobileItems?: NavItem[]
  action?: ReactNode
  search?: ReactNode
  hideMobileHeader?: boolean
  children: ReactNode
}

/**
 * Casca das duas visões: cabeçalho fixo com links no desktop e barra de navegação inferior
 * no mobile (padrão de app), com o conteúdo entre as duas.
 */
export function AppShell({
  homeTo,
  badge,
  items,
  mobileItems = items,
  action,
  search,
  hideMobileHeader = false,
  children,
}: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col [--header-h:3.5rem] md:[--header-h:4rem]">
      <header className={cn('sticky top-0 z-30', hideMobileHeader && 'max-md:hidden')}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -bottom-10 -z-10 bg-background/80 mask-b-from-40% backdrop-blur-xl"
        />
        <div className={cn(pageContainer, 'flex h-(--header-h) items-center gap-3 md:gap-8')}>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              to={homeTo}
              className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Brand />
            </Link>
            {badge}
          </div>
          <nav aria-label="Principal" className="hidden shrink-0 items-center gap-1 md:flex">
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact, includeSearch: false }}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[status=active]:bg-surface-raised data-[status=active]:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {(search || action) && (
            <div className="ml-auto hidden min-w-0 flex-1 items-center justify-end gap-3 md:flex">
              {search && <div className="w-full max-w-sm">{search}</div>}
              {action}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 pb-28 md:pb-16">{children}</main>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <ul className="mx-auto flex h-16 max-w-md items-stretch justify-around">
          {mobileItems.map(({ to, label, icon: Icon, exact }) => (
            <li key={to} className="flex flex-1">
              <Link
                to={to}
                activeOptions={{ exact, includeSearch: false }}
                className="flex flex-1 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium text-subtle-foreground transition-colors outline-none focus-visible:text-foreground data-[status=active]:text-primary"
              >
                <Icon aria-hidden className="size-5" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
