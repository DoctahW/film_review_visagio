import { Avatar as BaseAvatar } from '@base-ui/react/avatar'

import { cn } from '@/lib/utils'

const sizes = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-16 text-lg',
} as const

// Tons neutros escuros derivados dos tokens: variam o suficiente para distinguir pessoas sem competir com o acento.
const tones = [
  'bg-surface-raised',
  'bg-border',
  'bg-foreground/10',
  'bg-foreground/15',
  'bg-muted-foreground/25',
] as const

export interface AvatarProps {
  name: string
  src?: string | null
  size?: keyof typeof sizes
  className?: string
}

/** Até duas iniciais: primeira letra do primeiro e do último nome ("Greta Gerwig" → "GG"). */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const firstAndLast = [...words.slice(0, 1), ...words.slice(1).slice(-1)]
  const letters = firstAndLast.map((word) => Array.from(word)[0]).join('')
  return letters ? letters.toLocaleUpperCase('pt-BR') : '?'
}

/** O mesmo nome sempre cai no mesmo tom. */
function toneFor(name: string) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.codePointAt(0)!) | 0
  return tones[Math.abs(hash) % tones.length]
}

/** Foto de pessoa (elenco, equipe, autor da review) com iniciais enquanto carrega ou se faltar. */
export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  return (
    <BaseAvatar.Root
      role="img"
      aria-label={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full align-middle leading-none font-semibold text-muted-foreground select-none',
        sizes[size],
        toneFor(name),
        className,
      )}
    >
      {src && <BaseAvatar.Image src={src} alt="" className="size-full object-cover" />}
      <BaseAvatar.Fallback
        delay={src ? 400 : 0}
        className="flex size-full items-center justify-center"
      >
        {initials(name)}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  )
}
