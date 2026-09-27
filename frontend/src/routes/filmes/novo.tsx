import { createFileRoute } from '@tanstack/react-router'

import { genresQueryOptions } from '@/modules/genres'

export const Route = createFileRoute('/filmes/novo')({
  // Sugestões de gênero do formulário.
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(genresQueryOptions)
  },
  component: MovieCreatePage,
})

// Casca provisória: o formulário (F5) entra na fase de UI.
function MovieCreatePage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Novo filme</h1>
    </main>
  )
}
