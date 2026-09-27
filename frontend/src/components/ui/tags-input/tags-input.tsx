import { Combobox } from '@base-ui/react/combobox'
import { Check, Plus, X } from 'lucide-react'
import { useState, type FocusEventHandler, type KeyboardEvent } from 'react'

import { controlSurfaceClasses } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type TagsInputProps = {
  value: string[]
  onValueChange: (value: string[]) => void
  /** Opções oferecidas numa lista filtrada pelo texto digitado. Sem elas, não há lista. */
  suggestions?: string[]
  /** Aceita textos que não estão nas sugestões (Enter adiciona o que foi digitado). */
  allowCreate?: boolean
  placeholder?: string
  id?: string
  'aria-label'?: string
  invalid?: boolean
  onBlur?: FocusEventHandler<HTMLInputElement>
  className?: string
  disabled?: boolean
}

const normalize = (text: string) => text.trim().toLocaleLowerCase('pt-BR')

/** Remove duplicatas sem diferenciar maiúsculas, mantendo a primeira grafia. */
function dedupe(tags: string[]): string[] {
  const seen = new Set<string>()
  return tags.filter((tag) => {
    const key = normalize(tag)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function TagsInput({
  value,
  onValueChange,
  suggestions,
  allowCreate = true,
  placeholder,
  id,
  'aria-label': ariaLabel,
  invalid,
  onBlur,
  className,
  disabled,
}: TagsInputProps) {
  const [query, setQuery] = useState('')

  const typed = query.trim()
  const typedKey = normalize(typed)
  const selectedKeys = new Set(value.map(normalize))
  const knownSuggestion = suggestions?.find((suggestion) => normalize(suggestion) === typedKey)
  // Item "Adicionar …" quando o texto digitado ainda não existe nem foi escolhido.
  const creatable =
    allowCreate && typed !== '' && !knownSuggestion && !selectedKeys.has(typedKey) ? typed : null
  const items = suggestions ? (creatable ? [...suggestions, creatable] : suggestions) : []

  function addTyped() {
    if (typed === '') return
    if (!selectedKeys.has(typedKey)) {
      const tag = knownSuggestion ?? (allowCreate ? typed : null)
      if (tag === null) return
      onValueChange([...value, tag])
    }
    setQuery('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Com um item destacado na lista, o Enter é do Base UI (seleciona o item).
    if (event.key !== 'Enter' || event.currentTarget.hasAttribute('aria-activedescendant')) return
    if (typed === '') return
    // Não submete o formulário: o Enter confirma a tag.
    event.preventDefault()
    addTyped()
  }

  return (
    <Combobox.Root
      multiple
      items={items}
      value={value}
      onValueChange={(next) => onValueChange(dedupe(next))}
      inputValue={query}
      onInputValueChange={setQuery}
      locale="pt-BR"
      // Enter escolhe a primeira sugestão que casa ("dra" → "Drama"); "Adicionar …" fica por
      // último e só é destacado sozinho, quando nada casa.
      autoHighlight={suggestions !== undefined}
      disabled={disabled}
    >
      <Combobox.InputGroup
        className={cn(
          controlSurfaceClasses,
          'flex min-h-11 cursor-text items-center px-2 py-1.5',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background data-invalid:focus-within:ring-danger',
          invalid && 'ring-2 ring-danger focus-within:ring-danger',
          className,
        )}
      >
        <Combobox.Chips className="flex w-full flex-wrap items-center gap-1.5">
          {value.map((tag) => (
            <Combobox.Chip
              key={tag}
              aria-label={tag}
              className={cn(
                'flex h-8 max-w-full cursor-default items-center gap-1 rounded-full bg-surface-raised pr-1 pl-3 text-sm text-foreground outline-none',
                'focus-within:bg-primary/15 focus-within:text-primary data-highlighted:bg-primary/15 data-highlighted:text-primary',
              )}
            >
              <span className="truncate">{tag}</span>
              <Combobox.ChipRemove
                aria-label={`Remover ${tag}`}
                className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                <X aria-hidden className="size-3.5" />
              </Combobox.ChipRemove>
            </Combobox.Chip>
          ))}
          <Combobox.Input
            id={id}
            aria-label={ariaLabel}
            aria-invalid={invalid || undefined}
            placeholder={value.length > 0 ? undefined : placeholder}
            onKeyDown={handleKeyDown}
            onBlur={onBlur}
            className="h-8 min-w-24 flex-1 bg-transparent px-2 text-foreground outline-none placeholder:text-subtle-foreground"
          />
        </Combobox.Chips>
      </Combobox.InputGroup>

      {suggestions && (
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={6} className="z-50 outline-none">
            <Combobox.Popup
              className={cn(
                'max-h-[min(var(--available-height),18rem)] w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) overflow-y-auto overscroll-contain rounded-control border border-border bg-surface-raised p-1 text-sm text-foreground shadow-xl outline-none',
                'transition-[opacity,scale,translate] duration-150 ease-out',
                'data-starting-style:-translate-y-1 data-starting-style:scale-[0.98] data-starting-style:opacity-0',
                'data-ending-style:-translate-y-1 data-ending-style:scale-[0.98] data-ending-style:opacity-0',
              )}
            >
              <Combobox.Empty className="px-3 py-2.5 text-muted-foreground empty:hidden">
                Nenhuma opção encontrada.
              </Combobox.Empty>
              <Combobox.List>
                {(item: string) => (
                  <Combobox.Item
                    key={item}
                    value={item}
                    className={cn(
                      'grid cursor-default grid-cols-[1rem_1fr] items-center gap-2.5 rounded-lg py-2.5 pr-4 pl-3 outline-none select-none',
                      'text-muted-foreground data-highlighted:bg-surface data-highlighted:text-foreground data-selected:text-foreground',
                    )}
                  >
                    {item === creatable ? (
                      <>
                        <Plus aria-hidden className="size-4 text-primary" />
                        <span>Adicionar “{item}”</span>
                      </>
                    ) : (
                      <>
                        <Combobox.ItemIndicator className="col-start-1 text-primary">
                          <Check aria-hidden className="size-4" />
                        </Combobox.ItemIndicator>
                        <span className="col-start-2">{item}</span>
                      </>
                    )}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      )}
    </Combobox.Root>
  )
}
