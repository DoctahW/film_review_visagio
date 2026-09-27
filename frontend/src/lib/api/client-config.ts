import { env } from '@/lib/env'

import type { CreateClientConfig } from './generated/client.gen'

// Lido por `generated/client.gen.ts` antes de instanciar o client.
export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: env.VITE_API_URL,
})
