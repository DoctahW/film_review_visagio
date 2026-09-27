import { useCallback, useSyncExternalStore } from 'react'

/** Breakpoint `md` do Tailwind: a partir daqui o layout é de desktop. */
export const DESKTOP_QUERY = '(min-width: 48rem)'

/** Acompanha uma media query; no servidor (e no primeiro render sem `window`) vale `false`. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}
