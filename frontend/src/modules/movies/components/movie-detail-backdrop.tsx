import { useState } from 'react'

import { tmdbImage } from '@/lib/image'
import { cn } from '@/lib/utils'

type MovieDetailBackdropProps = {
  backdrop: string | null
  className?: string
}

/**
 * Backdrop no topo do detalhe, fundindo no fundo da página. Sem backdrop (ou se a imagem quebrar)
 * o topo fica liso. Decorativo: o pôster e o título já identificam o filme.
 */
export function MovieDetailBackdrop({ backdrop, className }: MovieDetailBackdropProps) {
  // URL que quebrou (ex.: link inválido cadastrado pela interface) deixa o topo liso.
  const [failed, setFailed] = useState<string | null>(null)
  if (!backdrop || failed === backdrop) return null

  return (
    // A máscara zera a borda de baixo de verdade: só o degradê deixava uma linha do backdrop
    // visível no limite (antialiasing em telas com zoom fracionário).
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 overflow-hidden mask-b-from-60%',
        className,
      )}
    >
      <img
        key={backdrop}
        src={tmdbImage(backdrop, 'w1280')}
        srcSet={`${tmdbImage(backdrop, 'w780')} 780w, ${tmdbImage(backdrop, 'w1280')} 1280w`}
        sizes="100vw"
        alt=""
        fetchPriority="high"
        decoding="async"
        onError={() => setFailed(backdrop)}
        className="absolute inset-0 size-full object-cover object-[50%_25%]"
      />
      {/* Escurece a imagem para o texto ler bem; não é decoração. */}
      <div className="absolute inset-0 bg-linear-to-t from-background via-background/55 to-background/5" />
      <div className="absolute inset-0 hidden bg-linear-to-r from-background/85 via-background/35 to-transparent md:block" />
    </div>
  )
}
