import js from '@eslint/js'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginRouter from '@tanstack/eslint-plugin-router'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Camadas (ver README): routes → modules → components → components/ui → hooks/lib.
// Cada grupo lista o que a camada NÃO pode importar.
const generatedApi = {
  group: ['@/lib/api/generated', '@/lib/api/generated/*', '**/api/generated/*'],
  message: 'Importe de "@/lib/api": o índice instala o interceptor de erros.',
}
const upperLayers = (...layers) =>
  layers.map((layer) => ({
    group: [`@/${layer}`, `@/${layer}/*`],
    message: `Camada inferior não importa de "@/${layer}".`,
  }))
const moduleInternals = {
  group: ['@/modules/*/*', '../../*'],
  message: 'Outro módulo só pelo índice público: "@/modules/<nome>".',
}

const restrict = (...patterns) => ({
  'no-restricted-imports': ['error', { patterns: [generatedApi, ...patterns] }],
})

export default defineConfig([
  globalIgnores([
    'dist',
    'storybook-static',
    'coverage',
    'src/routeTree.gen.ts',
    'src/lib/api/generated',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
      pluginQuery.configs['flat/recommended'],
      pluginRouter.configs['flat/recommended'],
    ],
    languageOptions: { globals: globals.browser },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      ...restrict(),
    },
  },
  {
    // Rotas exportam `Route` com o componente embutido; o plugin do router cuida do HMR delas.
    files: ['src/routes/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['src/modules/**'],
    rules: restrict(...upperLayers('app', 'routes'), moduleInternals),
  },
  {
    files: ['src/components/**'],
    rules: restrict(...upperLayers('app', 'routes', 'modules')),
  },
  {
    files: ['src/components/ui/**'],
    rules: {
      ...restrict(...upperLayers('app', 'routes', 'modules')),
      // Primitivos exportam as variantes (cva) junto do componente.
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/hooks/**', 'src/lib/**'],
    rules: restrict(...upperLayers('app', 'routes', 'modules', 'components')),
  },
  {
    // `lib/api` é o dono do código gerado: libera `generated/`, mantém as regras de camada.
    files: ['src/lib/api/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: upperLayers('app', 'routes', 'modules', 'components') },
      ],
    },
  },
  {
    // Rodam no Node; `.storybook/preview.tsx` roda no navegador e fica com os globals de browser.
    files: ['*.config.{js,ts}', '.storybook/main.ts'],
    languageOptions: { globals: globals.node },
  },
  prettier,
])
