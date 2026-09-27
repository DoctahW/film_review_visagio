import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Tokens de raio definidos em `app/styles.css`; sem isso `rounded-card` não sobrescreve `rounded-control`.
const twMerge = extendTailwindMerge({
  extend: { theme: { radius: ['control', 'card'] } },
})

/** Junta classes condicionais e resolve conflitos do Tailwind (a última vence). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
