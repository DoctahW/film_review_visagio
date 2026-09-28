import { createFileRoute, Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { House, Search, ShieldCheck } from 'lucide-react'

import { AppShell, type NavItem } from '@/components/layout/app-shell'
import { HeaderSearch } from '@/components/layout/header-search'
import { buttonVariants } from '@/components/ui/button'

const items: NavItem[] = [
  { to: '/', label: 'Início', icon: House, exact: true },
  { to: '/filmes', label: 'Catálogo', icon: Search },
]

const mobileItems: NavItem[] = [...items, { to: '/admin', label: 'ADM', icon: ShieldCheck }]

// Visão pública (somente leitura). A gestão fica em /admin.
export const Route = createFileRoute('/_site')({
  component: SiteLayout,
})

function SiteLayout() {
  const navigate = useNavigate()
  const pathname = useLocation({ select: (location) => location.pathname })
  const isHome = pathname === '/'
  return (
    <AppShell
      homeTo="/"
      hideMobileHeader={isHome}
      items={items}
      mobileItems={mobileItems}
      // O catálogo já tem a própria busca; nas outras telas o cabeçalho leva até ele.
      search={
        pathname !== '/filmes' && (
          <HeaderSearch
            placeholder="Buscar filmes ou diretores"
            onSearch={(q) => void navigate({ to: '/filmes', search: { q: q || undefined } })}
          />
        )
      }
      action={
        <Link to="/admin" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
          <ShieldCheck aria-hidden className="size-4" />
          Área do ADM
        </Link>
      }
    >
      <Outlet />
    </AppShell>
  )
}
