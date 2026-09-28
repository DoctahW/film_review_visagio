import { Film } from 'lucide-react'
import { useState } from 'react'

import { tmdbImage, type TmdbWidth } from '@/lib/image'
import { cn } from '@/lib/utils'

type PosterImageProps = {
  src: string | null
  /** Título do filme: texto alternativo e legenda do fallback. */
  title: string
  width?: TmdbWidth
  /** Imagens acima da dobra (hero, carrossel) carregam sem `lazy`. */
  priority?: boolean
  className?: string
}

/**
 * Pôster ou backdrop com fallback quando a URL é nula ou a imagem quebra.
 * O tamanho vem de `className` (ex.: `aspect-2/3 w-full`); a imagem cobre a caixa.
 */
export function PosterImage({ src, title, width, priority, className }: PosterImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const url = src && width ? tmdbImage(src, width) : src
  const showImage = url !== null && failedSrc !== url

  return (
    <div className={cn('relative overflow-hidden bg-surface-raised', className)}>
      {showImage ? (
        <img
          src={url}
          alt={title}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailedSrc(url)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={title}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-raised p-3 text-center"
        >
          <Film aria-hidden className="size-7 text-subtle-foreground" />
          <span className="line-clamp-3 text-xs font-semibold text-muted-foreground">{title}</span>
        </div>
      )}
    </div>
  )
}
