import './app/styles.css'

import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { z } from 'zod'

import { queryClient } from './app/query-client'
import { router } from './app/router'

// Mensagens padrão do Zod em português; schemas de formulário sobrescrevem onde precisam.
z.config(z.locales.pt())

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Elemento #root não encontrado em index.html')

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
