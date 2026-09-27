import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createMovie, deleteMovie, updateMovie, type MovieCreate } from '@/lib/api'
import { genreKeys } from '@/modules/genres'

import { movieKeys } from '../api/movies.queries'

// Cadastro e edição podem criar gênero novo.

export function useCreateMovie() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: MovieCreate) => (await createMovie({ body })).data,
    onSuccess: (movie) => {
      queryClient.setQueryData(movieKeys.detail(movie.sk_movie_id), movie)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: movieKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: genreKeys.all }),
      ])
    },
  })
}

export function useUpdateMovie(movieId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    // PUT substitui o filme inteiro. (depois verificar se vale mudar pra PATCH)
    mutationFn: async (body: MovieCreate) =>
      (await updateMovie({ path: { sk_movie_id: movieId }, body })).data,
    onSuccess: (movie) => {
      queryClient.setQueryData(movieKeys.detail(movieId), movie)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: movieKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: genreKeys.all }),
      ])
    },
  })
}

export function useDeleteMovie() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (movieId: string) => {
      await deleteMovie({ path: { sk_movie_id: movieId } })
    },
    onSuccess: (_, movieId) => {
      queryClient.removeQueries({ queryKey: movieKeys.detail(movieId) })
      return queryClient.invalidateQueries({ queryKey: movieKeys.lists() })
    },
  })
}
