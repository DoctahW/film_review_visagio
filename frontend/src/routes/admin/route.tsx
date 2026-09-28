import { createFileRoute, Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { Eye, Film, Plus } from 'lucide-react'

import { AppShell, type NavItem } from '@/components/layout/app-shell'
import { HeaderSearch } from '@/components/layout/header-search'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'

const items: NavItem[] = [
  { to: '/admin', label: 'Filmes', icon: Film, exact: true },
  { to: '/admin/filmes/novo', label: 'Novo filme', icon: Plus },
]

const mobileItems: NavItem[] = [...items, { to: '/', label: 'Ver site', icon: Eye, exact: true }]

// Área de gestão, sem autenticação (ver README): cadastro, edição, exclusão e novas avaliações.
export const Route = createFileRoute('/admin')({
  component: AdminLayout,
})

function AdminLayout() {
  const navigate = useNavigate()
  // A lista de gestão já tem a própria busca; nas outras telas o cabeçalho leva até ela.
  const onList = useLocation({ select: (location) => location.pathname === '/admin' })
  return (
    <AppShell
      homeTo="/admin"
      badge={<Badge variant="accent">Administração</Badge>}
      items={items}
      mobileItems={mobileItems}
      search={
        !onList && (
          <HeaderSearch
            placeholder="Buscar no catálogo"
            onSearch={(q) => void navigate({ to: '/admin', search: { q: q || undefined } })}
          />
        )
      }
      action={
        <Link to="/" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <Eye aria-hidden className="size-4" />
          Ver site
        </Link>
      }
    >
      <Outlet />
    </AppShell>
  )
}
