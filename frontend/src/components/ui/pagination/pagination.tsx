import { ChevronLeft, ChevronRight, Ellipsis } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Páginas visíveis: sempre a primeira, a última e a atual ±1. Buracos viram `'ellipsis'`,
 * exceto quando escondem uma página só (mostrar o número ocupa o mesmo espaço que as reticências).
 */
export function paginationRange(page: number, pages: number): (number | 'ellipsis')[] {
  if (pages < 1) return []
  const current = Math.min(pages, Math.max(1, page))
  const visible = [...new Set([1, current - 1, current, current + 1, pages])]
    .filter((p) => p >= 1 && p <= pages)
    .sort((a, b) => a - b)

  const range: (number | 'ellipsis')[] = []
  let previous = 0
  for (const p of visible) {
    if (p - previous === 2) range.push(previous + 1)
    else if (p - previous > 2) range.push('ellipsis')
    range.push(p)
    previous = p
  }
  return range
}

export interface PaginationProps {
  /** Página atual, começando em 1. */
  page: number
  pages: number
  onPageChange: (page: number) => void
  className?: string
}

/** Anterior/próxima + números com reticências. No celular (< sm): só "Página X de Y" entre as setas. */
export function Pagination({ page, pages, onPageChange, className }: PaginationProps) {
  if (pages <= 1) return null

  return (
    <nav
      aria-label="Paginação"
      className={cn('flex items-center justify-between gap-2 sm:justify-center', className)}
    >
      <Button
        variant="secondary"
        size="icon"
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft aria-hidden className="size-5" />
      </Button>

      <p className="text-sm text-muted-foreground sm:hidden">
        Página <span className="font-semibold text-foreground">{page}</span> de {pages}
      </p>

      <ul className="hidden items-center gap-1 sm:flex">
        {paginationRange(page, pages).map((item, index) =>
          item === 'ellipsis' ? (
            <li
              key={`ellipsis-${index}`}
              className="flex size-9 items-center justify-center text-subtle-foreground"
            >
              <Ellipsis aria-hidden className="size-4" />
            </li>
          ) : (
            <li key={item}>
              <Button
                variant={item === page ? 'primary' : 'ghost'}
                size="sm"
                className="min-w-9 px-2 tabular-nums"
                aria-label={`Página ${item}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => {
                  if (item !== page) onPageChange(item)
                }}
              >
                {item}
              </Button>
            </li>
          ),
        )}
      </ul>

      <Button
        variant="secondary"
        size="icon"
        aria-label="Próxima página"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight aria-hidden className="size-5" />
      </Button>
    </nav>
  )
}
