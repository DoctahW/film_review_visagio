import { useEffect, useState } from 'react'

import { PosterImage } from '@/components/poster-image'
import { cn } from '@/lib/utils'

type MovieFormPosterPreviewProps = {
  url: string
  title: string
  year: number | null
  genres: string[]
  className?: string
}

/** Só pede a imagem quando o texto já parece uma URL completa. */
function previewSource(url: string): string | null {
  const trimmed = url.trim()
  return /^https?:\/\/[^/\s]+\.[^/\s]+\/\S+/.test(trimmed) && URL.canParse(trimmed) ? trimmed : null
}

/** Espera a digitação parar antes de trocar a imagem (evita um request por tecla). */
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/**
 * Prévia ao vivo do pôster com título e metadados, como o filme aparece no catálogo.
 * Celular: faixa compacta acima dos campos; desktop: coluna lateral.
 */
export function MovieFormPosterPreview({
  url,
  title,
  year,
  genres,
  className,
}: MovieFormPosterPreviewProps) {
  const src = previewSource(useDebounced(url, 400))
  const name = title.trim() || 'Sem título'
  const meta = [year, ...genres].filter(Boolean).join(' · ')
  const hint =
    url.trim() === ''
      ? 'Sem URL do pôster: o catálogo mostra a capa padrão.'
      : previewSource(url) === null
        ? 'Complete a URL para ver o pôster.'
        : null

  return (
    <figure
      className={cn(
        'flex items-center gap-4 rounded-card border border-border bg-surface p-3',
        'md:flex-col md:items-stretch md:gap-4 md:p-4',
        className,
      )}
    >
      <PosterImage
        src={src}
        title={name}
        className="aspect-2/3 w-24 shrink-0 rounded-xl shadow-poster md:w-full md:rounded-2xl"
      />
      <figcaption className="flex min-w-0 flex-col gap-1">
        <span className="text-sm text-muted-foreground">Prévia</span>
        <span className="line-clamp-2 font-bold tracking-tight text-foreground">{name}</span>
        {meta && <span className="line-clamp-2 text-sm text-muted-foreground">{meta}</span>}
        {hint && <span className="text-xs text-subtle-foreground">{hint}</span>}
      </figcaption>
    </figure>
  )
}
