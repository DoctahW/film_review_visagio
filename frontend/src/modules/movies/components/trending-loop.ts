import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react'

/** Como um slide aparece a `delta` posições do centro (negativo = à esquerda). */
export type SlideLayout = (
  delta: number,
  slideWidth: number,
) => { x: number; scale: number; opacity: number }

/** Distância circular de `delta` até 0 numa roda de `count` itens, em (-count/2, count/2]. */
export function wrapDelta(delta: number, count: number): number {
  const mod = ((delta % count) + count) % count
  return mod > count / 2 ? mod - count : mod
}

const DRAG_THRESHOLD = 6
/** Constante de tempo da aproximação exponencial até o alvo (ms). */
const EASE_MS = 110
/** Quanto do impulso do arraste vira deslocamento extra (ms de projeção). */
const FLING_MS = 160
const WHEEL_SNAP_MS = 140

/**
 * Carrossel em roda: a posição é contínua e sem limites (1 = um slide), e cada slide é
 * posicionado pela distância circular até o centro. Assim o ativo fica sempre no meio com
 * vizinhos dos dois lados, e passar do último volta ao primeiro sem clonar slides.
 *
 * Transformações vão direto no DOM a cada quadro; o React só re-renderiza quando o slide
 * ativo muda. Arraste com ponteiro (mouse e toque; `touch-action: pan-y` no trilho deixa a
 * rolagem vertical com o navegador), rolagem horizontal do trackpad e `goTo`/`step`.
 */
export function useLoopCarousel(count: number, layout: SlideLayout) {
  const trackRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLElement | null)[]>([])
  const layoutRef = useRef(layout)
  const position = useRef(0)
  const target = useRef(0)
  const frame = useRef(0)
  const suppressClick = useRef(false)
  const [active, setActive] = useState(0)

  useLayoutEffect(() => {
    layoutRef.current = layout
  })

  const slideWidth = () => slideRefs.current.find(Boolean)?.offsetWidth ?? 0
  const stepPx = () => {
    const width = slideWidth()
    return Math.abs(layoutRef.current(1, width).x - layoutRef.current(0, width).x) || 1
  }

  const apply = useCallback(() => {
    const width = slideRefs.current.find(Boolean)?.offsetWidth ?? 0
    slideRefs.current.forEach((slide, index) => {
      if (!slide) return
      const delta = wrapDelta(index - position.current, count)
      const { x, scale, opacity } = layoutRef.current(delta, width)
      slide.style.transform = `translate3d(${x}px, 0, 0) scale(${scale})`
      slide.style.opacity = String(opacity)
      slide.style.visibility = opacity <= 0.01 ? 'hidden' : 'visible'
      slide.style.zIndex = String(100 - Math.round(Math.abs(delta) * 10))
    })
    const current = wrapDelta(Math.round(position.current), count)
    setActive(current < 0 ? current + count : current)
  }, [count])

  const stop = () => {
    cancelAnimationFrame(frame.current)
    frame.current = 0
  }

  const animate = useCallback(() => {
    cancelAnimationFrame(frame.current)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      position.current = target.current
      apply()
      return
    }
    let last = performance.now()
    const tick = (now: number) => {
      const elapsed = Math.min(64, now - last)
      last = now
      const diff = target.current - position.current
      if (Math.abs(diff) < 0.0005) {
        position.current = target.current
        apply()
        frame.current = 0
        return
      }
      position.current += diff * (1 - Math.exp(-elapsed / EASE_MS))
      apply()
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
  }, [apply])

  /** Vai ao slide `index` pelo caminho mais curto da roda. */
  const goTo = useCallback(
    (index: number) => {
      target.current += wrapDelta(index - Math.round(target.current), count)
      animate()
    },
    [animate, count],
  )

  const step = useCallback(
    (direction: 1 | -1) => {
      target.current = Math.round(target.current) + direction
      animate()
    },
    [animate],
  )

  // Layout inicial, redimensionamento e rolagem horizontal do trackpad.
  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(track)

    let snap = 0
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
      event.preventDefault()
      stop()
      position.current += event.deltaX / stepPx()
      target.current = position.current
      apply()
      window.clearTimeout(snap)
      snap = window.setTimeout(() => {
        target.current = Math.round(position.current)
        animate()
      }, WHEEL_SNAP_MS)
    }
    track.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      observer.disconnect()
      track.removeEventListener('wheel', onWheel)
      window.clearTimeout(snap)
    }
    // `stepPx` só lê refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apply, animate])

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  // Arraste: só assume o gesto quando ele é mais horizontal que vertical.
  const drag = useRef<{
    id: number
    x: number
    y: number
    start: number
    state: 'pending' | 'dragging' | 'ignored'
    samples: { x: number; t: number }[]
  } | null>(null)

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      start: position.current,
      state: 'pending',
      samples: [{ x: event.clientX, t: event.timeStamp }],
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current
    if (!current || current.id !== event.pointerId || current.state === 'ignored') return
    const dx = event.clientX - current.x
    const dy = event.clientY - current.y
    if (current.state === 'pending') {
      if (Math.abs(dy) > DRAG_THRESHOLD && Math.abs(dy) >= Math.abs(dx)) {
        current.state = 'ignored'
        return
      }
      if (Math.abs(dx) <= DRAG_THRESHOLD) return
      current.state = 'dragging'
      current.start = position.current + dx / stepPx()
      stop()
      event.currentTarget.setPointerCapture(event.pointerId)
      event.currentTarget.dataset.dragging = ''
    }
    position.current = current.start - dx / stepPx()
    target.current = position.current
    current.samples = [...current.samples.slice(-4), { x: event.clientX, t: event.timeStamp }]
    apply()
  }

  const onPointerEnd = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current
    if (!current || current.id !== event.pointerId) return
    drag.current = null
    if (current.state !== 'dragging') return
    delete event.currentTarget.dataset.dragging
    const first = current.samples[0]
    const last = current.samples.at(-1)
    const velocity = first && last && last.t > first.t ? (last.x - first.x) / (last.t - first.t) : 0
    const projected = position.current - (velocity * FLING_MS) / stepPx()
    // Um arraste curto mas intencional ainda troca de slide.
    const direction = Math.sign(position.current - Math.round(current.start))
    const rounded = Math.round(projected)
    target.current =
      rounded === Math.round(current.start) && Math.abs(position.current - current.start) > 0.15
        ? rounded + direction
        : rounded
    // O `click` que o navegador dispara depois do arraste não deve abrir o pôster.
    suppressClick.current = true
    window.setTimeout(() => {
      suppressClick.current = false
    }, 0)
    animate()
  }

  const trackProps = {
    ref: trackRef,
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerEnd,
    onPointerCancel: onPointerEnd,
    onDragStart: (event: DragEvent) => event.preventDefault(),
    onClickCapture: (event: MouseEvent) => {
      if (!suppressClick.current) return
      event.preventDefault()
      event.stopPropagation()
    },
  }

  const slideRef = (index: number) => (node: HTMLElement | null) => {
    slideRefs.current[index] = node
  }

  return { active, goTo, step, trackProps, slideRef }
}
