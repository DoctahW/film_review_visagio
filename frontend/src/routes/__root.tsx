import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

import type { RouterContext } from '@/app/router'
import { NotFoundPage } from '@/components/not-found-page'
import { ToastProvider } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'

const Devtools = import.meta.env.DEV ? lazy(() => import('@/app/devtools')) : () => null

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <NotFoundPage />,
})

function RootLayout() {
  return (
    <ToastProvider>
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
      <Suspense>
        <Devtools />
      </Suspense>
    </ToastProvider>
  )
}
