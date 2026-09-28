import { ArrowDownWideNarrow, ArrowUpNarrowWide, Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NumberInput } from '@/components/ui/number-input'
import { Select, type SelectItem } from '@/components/ui/select'
import { Sheet } from '@/components/ui/sheet'
import { Tooltip } from '@/components/ui/tooltip'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { useGenres } from '@/modules/genres'

import {
  MIN_SEARCH_LENGTH,
  movieSearchDefaults,
  type MovieSearch,
} from '../schemas/movie-search.schema'
import {
  clearedMovieSearch,
  countPanelFilters,
  hasActiveFilters,
  isCustomSort,
} from './catalog-search-state'

type MovieSort = MovieSearch['sort']
type SortOrder = MovieSearch['order']

export type MovieFiltersProps = {
  search: MovieSearch
  /** Recebe só o que mudou; toda mudança de filtro já vem com `page: 1`. */
  onSearchChange: (next: Partial<MovieSearch>) => void
  className?: string
}

const SEARCH_DEBOUNCE_MS = 300
// Mesmos limites do `movieSearchSchema`: fora deles o ano ainda está sendo digitado.
const MIN_YEAR = 1888
const MAX_YEAR = 2100

const sortItems: SelectItem<MovieSort>[] = [
  { value: 'popularidade', label: 'Popularidade' },
  { value: 'titulo', label: 'Título' },
  { value: 'ano', label: 'Ano' },
  { value: 'media', label: 'Nota média' },
]

const orderLabels: Record<MovieSort, Record<SortOrder, string>> = {
  popularidade: { desc: 'Mais populares primeiro', asc: 'Menos populares primeiro' },
  titulo: { asc: 'Título de A a Z', desc: 'Título de Z a A' },
  ano: { desc: 'Mais recentes primeiro', asc: 'Mais antigos primeiro' },
  media: { desc: 'Maiores notas primeiro', asc: 'Menores notas primeiro' },
}

/** Termo enviado à API: sem espaços nas pontas e só a partir do mínimo aceito (S4). */
function searchTerm(text: string): string | undefined {
  const trimmed = text.trim()
  return trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : undefined
}

/**
 * Busca (debounce de 300 ms) + gênero, ano e ordenação. No desktop os filtros ficam numa linha
 * abaixo da busca; no mobile vão para uma folha aberta pelo botão "Filtros".
 */
export function MovieFilters({ search, onSearchChange, className }: MovieFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const change = (next: Partial<MovieSearch>) => onSearchChange({ ...next, page: 1 })
  const clearAll = () => onSearchChange(clearedMovieSearch)
  const panelCount = countPanelFilters(search)
  const active = hasActiveFilters(search)

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-start gap-2">
        <SearchField query={search.q} onQueryChange={(q) => change({ q })} />
        <Sheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title="Filtros"
          trigger={
            <Button
              variant="secondary"
              className="h-12 px-4 md:hidden"
              aria-label={panelCount > 0 ? `Filtros, ${panelCount} ativos` : 'Filtros'}
            >
              <SlidersHorizontal aria-hidden />
              Filtros
              {panelCount > 0 && (
                <span
                  aria-hidden
                  className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground tabular-nums"
                >
                  {panelCount}
                </span>
              )}
            </Button>
          }
          footer={
            <>
              <Button variant="secondary" disabled={panelCount === 0} onClick={clearAll}>
                Limpar filtros
              </Button>
              <Button onClick={() => setSheetOpen(false)}>Ver resultados</Button>
            </>
          }
        >
          <FilterControls search={search} onChange={change} layout="stack" />
        </Sheet>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <FilterControls search={search} onChange={change} layout="row" />
        {active && (
          <Button variant="ghost" size="sm" className="ml-auto" onClick={clearAll}>
            <X aria-hidden />
            Limpar filtros
          </Button>
        )}
      </div>

      {active && <ActiveFilterPills search={search} onChange={change} onClearAll={clearAll} />}
    </div>
  )
}

type SearchFieldProps = {
  query: string | undefined
  onQueryChange: (q: string | undefined) => void
}

function SearchField({ query, onQueryChange }: SearchFieldProps) {
  const [text, setText] = useState(query ?? '')
  const debounced = useDebounce(text, SEARCH_DEBOUNCE_MS)

  // `q` mudou por fora (voltar do histórico, "Limpar filtros"): o campo acompanha. A volta do
  // próprio envio não mexe no texto, senão apagaria o que foi digitado depois.
  const [syncedQuery, setSyncedQuery] = useState(query)
  if (query !== syncedQuery) {
    setSyncedQuery(query)
    if (query !== searchTerm(debounced)) setText(query ?? '')
  }

  // Envia só quando o valor com debounce muda; mudanças de `q` vindas de fora não reenviam.
  const sentText = useRef(debounced)
  useEffect(() => {
    if (sentText.current === debounced) return
    sentText.current = debounced
    const next = searchTerm(debounced)
    if (next !== query) onQueryChange(next)
  }, [debounced, query, onQueryChange])

  const tooShort = text.trim().length > 0 && searchTerm(text) === undefined
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="min-w-0 flex-1">
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={inputRef}
          type="search"
          value={text}
          onValueChange={(value) => setText(value)}
          placeholder="Título ou diretor"
          aria-label="Buscar filmes por título ou diretor"
          aria-describedby={tooShort ? 'movie-search-hint' : undefined}
          enterKeyHint="search"
          autoComplete="off"
          className="h-12 rounded-full pr-12 pl-12 [&::-webkit-search-cancel-button]:appearance-none"
        />
        {text !== '' && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Limpar busca"
            className="absolute top-1/2 right-1.5 -translate-y-1/2"
            onClick={() => {
              setText('')
              if (query !== undefined) onQueryChange(undefined)
              inputRef.current?.focus()
            }}
          >
            <X aria-hidden className="size-4" />
          </Button>
        )}
      </div>
      {tooShort && (
        <p id="movie-search-hint" className="mt-1.5 px-4 text-xs text-muted-foreground">
          Digite pelo menos {MIN_SEARCH_LENGTH} caracteres para buscar.
        </p>
      )}
    </div>
  )
}

type FilterControlsProps = {
  search: MovieSearch
  onChange: (next: Partial<MovieSearch>) => void
  /** `row`: linha do desktop, rótulos só para leitores de tela. `stack`: folha do mobile. */
  layout: 'row' | 'stack'
}

function FilterControls({ search, onChange, layout }: FilterControlsProps) {
  const { data: genres, isPending } = useGenres()
  const genreItems: SelectItem<string>[] =
    genres?.map((genre) => ({ value: genre.nome_genero, label: genre.nome_genero })) ?? []
  const stack = layout === 'stack'

  const genre = (
    <Select
      items={genreItems}
      value={search.genero ?? null}
      onValueChange={(genero) => onChange({ genero: genero ?? undefined })}
      nullLabel="Todos os gêneros"
      disabled={isPending}
      aria-label={stack ? undefined : 'Gênero'}
      className={stack ? undefined : 'w-52'}
    />
  )
  const year = <YearFilter year={search.ano} onYearChange={(ano) => onChange({ ano })} />
  const sort = (
    <div className="flex gap-2">
      <Select
        items={sortItems}
        value={search.sort}
        onValueChange={(sort) => {
          // Título começa em A–Z; as demais, do maior para o menor.
          if (sort) onChange({ sort, order: sort === 'titulo' ? 'asc' : 'desc' })
        }}
        aria-label={stack ? undefined : 'Ordenar por'}
        className={stack ? 'flex-1' : 'w-44'}
      />
      <OrderToggle
        sort={search.sort}
        order={search.order}
        onOrderChange={(order) => onChange({ order })}
      />
    </div>
  )

  if (!stack) {
    return (
      <>
        {genre}
        <div className="w-32">{year}</div>
        {sort}
      </>
    )
  }

  return (
    // A folha já é `bg-surface`: os controles sobem um tom para não sumirem no fundo.
    <div className="flex flex-col gap-5 [&_.bg-surface]:bg-surface-raised">
      <StackedField label="Gênero" nonNativeLabel>
        {genre}
      </StackedField>
      <StackedField label="Ano de lançamento">{year}</StackedField>
      <StackedField label="Ordenar por" nonNativeLabel>
        {sort}
      </StackedField>
    </div>
  )
}

function StackedField({
  label,
  nonNativeLabel,
  children,
}: {
  label: string
  nonNativeLabel?: boolean
  children: ReactNode
}) {
  return (
    <Field>
      {nonNativeLabel ? (
        <FieldLabel nativeLabel={false} render={<div />}>
          {label}
        </FieldLabel>
      ) : (
        <FieldLabel>{label}</FieldLabel>
      )}
      {children}
    </Field>
  )
}

type YearFilterProps = {
  year: number | undefined
  onYearChange: (year: number | undefined) => void
}

/**
 * Ano digitado fica local até formar um ano válido; assim "1", "19", "199" não viram buscas.
 * Sem `min`/`max` no campo: o Base UI trocaria "2" por 1888 enquanto a pessoa digita.
 */
function YearFilter({ year, onYearChange }: YearFilterProps) {
  const [value, setValue] = useState<number | null>(year ?? null)
  const [syncedYear, setSyncedYear] = useState(year)
  if (year !== syncedYear) {
    setSyncedYear(year)
    setValue(year ?? null)
  }

  return (
    <NumberInput
      value={value}
      onValueChange={(next) => {
        setValue(next)
        if (next === null) {
          if (year !== undefined) onYearChange(undefined)
        } else if (next >= MIN_YEAR && next <= MAX_YEAR && next !== year) {
          onYearChange(next)
        }
      }}
      // Saiu do campo com um ano incompleto ou fora da faixa: volta ao filtro aplicado.
      onBlur={() => setValue(year ?? null)}
      placeholder="Ano"
      aria-label="Ano de lançamento"
    />
  )
}

type OrderToggleProps = {
  sort: MovieSort
  order: SortOrder
  onOrderChange: (order: SortOrder) => void
}

function OrderToggle({ sort, order, onOrderChange }: OrderToggleProps) {
  const Icon = order === 'desc' ? ArrowDownWideNarrow : ArrowUpNarrowWide
  const label = orderLabels[sort][order]

  return (
    <Tooltip label={label}>
      <Button
        variant="secondary"
        size="icon"
        aria-label={`Inverter ordem (atual: ${label})`}
        onClick={() => onOrderChange(order === 'desc' ? 'asc' : 'desc')}
      >
        <Icon aria-hidden className="size-5" />
      </Button>
    </Tooltip>
  )
}

type ActiveFilterPillsProps = {
  search: MovieSearch
  onChange: (next: Partial<MovieSearch>) => void
  onClearAll: () => void
}

/** Filtros ativos como pílulas removíveis (mobile: os controles ficam escondidos na folha). */
function ActiveFilterPills({ search, onChange, onClearAll }: ActiveFilterPillsProps) {
  return (
    <ul aria-label="Filtros ativos" className="flex flex-wrap items-center gap-2 md:hidden">
      {search.q !== undefined && (
        <FilterPill label={`“${search.q}”`} onRemove={() => onChange({ q: undefined })} />
      )}
      {search.genero !== undefined && (
        <FilterPill label={search.genero} onRemove={() => onChange({ genero: undefined })} />
      )}
      {search.ano !== undefined && (
        <FilterPill label={String(search.ano)} onRemove={() => onChange({ ano: undefined })} />
      )}
      {isCustomSort(search) && (
        <FilterPill
          label={orderLabels[search.sort][search.order]}
          onRemove={() =>
            onChange({ sort: movieSearchDefaults.sort, order: movieSearchDefaults.order })
          }
        />
      )}
      <li>
        <Button variant="ghost" size="sm" onClick={onClearAll}>
          Limpar filtros
        </Button>
      </li>
    </ul>
  )
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <li className="max-w-full">
      <Button
        variant="secondary"
        size="sm"
        aria-label={`Remover filtro ${label}`}
        className="max-w-full pr-3 pl-4"
        onClick={onRemove}
      >
        <span className="truncate">{label}</span>
        <X aria-hidden className="size-3.5 text-muted-foreground" />
      </Button>
    </li>
  )
}
