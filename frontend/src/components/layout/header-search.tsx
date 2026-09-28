import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type HeaderSearchProps = {
  placeholder: string
  onSearch: (query: string) => void
  className?: string
}

/**
 * Busca do cabeçalho: Enter leva ao catálogo com o termo. A tecla "/" foca o campo de qualquer
 * lugar da página (fora de outros campos de texto).
 */
export function HeaderSearch({ placeholder, onSearch, className }: HeaderSearchProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch(text.trim())
        setText('')
        inputRef.current?.blur()
      }}
      className={cn('group/search relative', className)}
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 z-10 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={inputRef}
        type="search"
        value={text}
        onValueChange={(value) => setText(value)}
        placeholder={placeholder}
        aria-label={placeholder}
        enterKeyHint="search"
        className="h-10 rounded-full bg-surface/80 pr-10 pl-10 [&::-webkit-search-cancel-button]:hidden"
      />
      <kbd
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 flex size-5 -translate-y-1/2 items-center justify-center rounded-md border border-border font-sans text-xs text-subtle-foreground group-focus-within/search:hidden"
      >
        /
      </kbd>
    </form>
  )
}
