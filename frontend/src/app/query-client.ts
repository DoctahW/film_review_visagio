import { QueryClient } from '@tanstack/react-query'

import { isApiError } from '@/lib/api'

const MAX_RETRIES = 2

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) =>
        failureCount < MAX_RETRIES && !(isApiError(error) && error.status < 500),
    },
  },
})
