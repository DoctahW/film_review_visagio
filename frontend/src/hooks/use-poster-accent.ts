import { useEffect, useState } from 'react'

import { pickAccent, type Accent } from '@/lib/color'
import { tmdbImage } from '@/lib/image'

// Uma extração por pôster na sessão: trocar de slide e voltar não relê a imagem.
const resolved = new Map<string, Accent | null>()
const pending = new Map<string, Promise<void>>()

const SAMPLE_WIDTH = 32
const SAMPLE_HEIGHT = 48

/**
 * Lê o pôster pequeno (w92) num canvas e guarda a cor de destaque. O CDN do TMDB responde com
 * CORS liberado; URLs de outros hosts sem CORS "sujam" o canvas e o pôster fica sem acento.
 */
export function loadPosterAccent(url: string): Promise<void> {
  const existing = pending.get(url)
  if (existing) return existing

  const promise = new Promise<void>((resolve) => {
    const settle = (accent: Accent | null) => {
      resolved.set(url, accent)
      resolve()
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = SAMPLE_WIDTH
        canvas.height = SAMPLE_HEIGHT
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context) return settle(null)
        context.drawImage(img, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT)
        settle(pickAccent(context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data))
      } catch {
        settle(null)
      }
    }
    img.onerror = () => settle(null)
    img.src = tmdbImage(url, 'w92')
  })
  pending.set(url, promise)
  return promise
}

/** Cor de destaque do pôster (`null` enquanto carrega, sem pôster ou pôster sem cor). */
export function usePosterAccent(url: string | null): Accent | null {
  const [, rerender] = useState(0)

  useEffect(() => {
    if (!url || resolved.has(url)) return
    let alive = true
    void loadPosterAccent(url).then(() => {
      if (alive) rerender((n) => n + 1)
    })
    return () => {
      alive = false
    }
  }, [url])

  return url ? (resolved.get(url) ?? null) : null
}
