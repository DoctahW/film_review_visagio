import { useLayoutEffect, type RefObject } from 'react'

/**
 * Liga `data-fade-start` / `data-fade-end` no elemento rolável conforme há conteúdo escondido à
 * esquerda / à direita (usado com o utilitário `scroll-fade-x`). Escreve direto no DOM, sem
 * re-render. `contentKey` refaz a medição quando o conteúdo muda (ex.: itens carregados).
 */
export function useScrollFade(ref: RefObject<HTMLElement | null>, contentKey?: unknown) {
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    let frame = 0
    const update = () => {
      frame = 0
      const { scrollLeft, scrollWidth, clientWidth } = element
      element.toggleAttribute('data-fade-start', scrollLeft > 1)
      element.toggleAttribute('data-fade-end', scrollLeft + clientWidth < scrollWidth - 1)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    element.addEventListener('scroll', schedule, { passive: true })
    const observer = new ResizeObserver(schedule)
    observer.observe(element)
    return () => {
      cancelAnimationFrame(frame)
      element.removeEventListener('scroll', schedule)
      observer.disconnect()
    }
  }, [ref, contentKey])
}
