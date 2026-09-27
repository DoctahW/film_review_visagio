import { ApiError } from './errors'
import { client } from './generated/client.gen'

// Único ponto de entrada da API: os módulos importam daqui, nunca de `generated/`,
// para que o interceptor abaixo esteja sempre instalado.
client.interceptors.error.use((error, response) =>
  response && !response.ok ? new ApiError(response.status, error) : error,
)

export * from './generated'
export * as schemas from './generated/zod.gen'
export { ApiError, isApiError } from './errors'
