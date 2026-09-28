import { useRef, useState } from 'react'

import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useScrollFade } from '@/hooks/use-scroll-fade'
import { formatInteger } from '@/lib/format'

const VISIBLE = 20

type MovieDetailCastProps = {
  cast: string[]
  /** Id do título da seção, que nomeia a faixa rolável. */
  labelledBy: string
}

/** Faixa horizontal de avatares redondos com o nome embaixo; mostra 20 e expande o resto. */
export function MovieDetailCast({ cast, labelledBy }: MovieDetailCastProps) {
  const [expanded, setExpanded] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)
  useScrollFade(scrollerRef, expanded)

  if (cast.length === 0) {
    return <p className="text-sm text-subtle-foreground">Não informado</p>
  }

  const shown = expanded ? cast : cast.slice(0, VISIBLE)
  const hidden = cast.length - shown.length

  return (
    // Rolável pelo teclado: a região recebe foco e as setas rolam a faixa.
    <div
      ref={scrollerRef}
      role="region"
      aria-labelledby={labelledBy}
      tabIndex={0}
      className="-mx-4 scrollbar-none scroll-px-4 overflow-x-auto scroll-fade-x px-4 pb-1 outline-none focus-visible:ring-2 focus-visible:ring-ring md:mx-0 md:scroll-px-0 md:rounded-control md:px-0"
    >
      <ul className="flex gap-4 md:gap-5">
        {shown.map((name, index) => (
          <li
            key={`${name}-${index}`}
            className="flex w-20 shrink-0 flex-col items-center gap-2 text-center"
          >
            <span aria-hidden>
              <Avatar name={name} size="lg" />
            </span>
            <span className="line-clamp-2 text-xs leading-snug font-medium">{name}</span>
          </li>
        ))}
        {hidden > 0 && (
          <li className="flex w-20 shrink-0 flex-col items-center gap-2 text-center">
            <Button
              variant="secondary"
              size="icon"
              className="size-16 text-base tabular-nums"
              aria-label={`Mostrar mais ${formatInteger(hidden)} pessoas do elenco`}
              onClick={() => setExpanded(true)}
            >
              +{formatInteger(hidden)}
            </Button>
            <span aria-hidden className="text-xs leading-snug text-muted-foreground">
              e mais {formatInteger(hidden)}
            </span>
          </li>
        )}
      </ul>
    </div>
  )
}
