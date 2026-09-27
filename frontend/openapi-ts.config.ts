import { defineConfig } from '@hey-api/openapi-ts'

// Gera tipos, schemas Zod e SDK a partir do contrato do backend.
// Rode com o backend no ar: `npm run gen:api`. A saída é versionada e nunca editada à mão.
export default defineConfig({
  input: process.env.OPENAPI_URL ?? 'http://localhost:8000/openapi.json',
  output: {
    path: 'src/lib/api/generated',
    postProcess: ['prettier'],
  },
  plugins: [
    {
      name: '@hey-api/client-fetch',
      runtimeConfigPath: './src/lib/api/client-config.ts',
      // Tipa e executa as chamadas lançando erro; `data` vem direto, sem união com `error`.
      throwOnError: true,
    },
    {
      name: 'zod',
      // O backend serializa datetimes sem fuso: `2026-09-24T19:55:05`.
      dates: { local: true, offset: true },
    },
    {
      name: '@hey-api/sdk',
      validator: { response: 'zod' },
    },
  ],
})
