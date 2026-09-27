import type { CSSProperties } from 'react'

/** Cor de destaque tirada de um pôster, com a cor de texto legível sobre ela. */
export type Accent = { color: string; foreground: string }

const HUE_BUCKETS = 24
const MIN_COLORFUL_SHARE = 0.03
const ACCENT_LIGHTNESS = 0.62
const LIGHT_TEXT = 'oklch(0.99 0 0)'
const DARK_TEXT = 'oklch(0.17 0.005 285)'
const DARK_TEXT_LUMINANCE = 0.012

/**
 * Escolhe a cor de destaque de uma imagem (RGBA de `getImageData`)
 */
export function pickAccent(pixels: Uint8ClampedArray): Accent | null {
  const buckets = Array.from({ length: HUE_BUCKETS }, () => ({ weight: 0, hue: 0, sat: 0, n: 0 }))
  let total = 0

  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if ((pixels[i + 3] ?? 0) < 200) continue
    total++
    const [h, s, l] = rgbToHsl(pixels[i] ?? 0, pixels[i + 1] ?? 0, pixels[i + 2] ?? 0)
    if (s < 0.3 || l < 0.18 || l > 0.85) continue
    const weight = s * (1 - Math.abs(l - 0.5))
    const bucket = buckets[Math.floor(h / (360 / HUE_BUCKETS)) % HUE_BUCKETS]
    if (!bucket) continue
    bucket.weight += weight
    bucket.hue += h * weight
    bucket.sat += s * weight
    bucket.n++
  }

  const best = buckets.reduce((a, b) => (b.weight > a.weight ? b : a))
  if (total === 0 || best.n < total * MIN_COLORFUL_SHARE) return null

  const hue = best.hue / best.weight
  const sat = Math.min(0.85, Math.max(0.55, best.sat / best.weight))
  const [r, g, b] = hslToRgb(hue, sat, ACCENT_LIGHTNESS)
  const luminance = relativeLuminance(r, g, b)
  const lightContrast = 1.05 / (luminance + 0.05)
  const darkContrast = (luminance + 0.05) / (DARK_TEXT_LUMINANCE + 0.05)

  return {
    color: `rgb(${r} ${g} ${b})`,
    foreground: lightContrast >= darkContrast ? LIGHT_TEXT : DARK_TEXT,
  }
}

/** Sobrescreve o acento do tema num trecho da página (os utilitários leem as variáveis). */
export function accentStyle(accent: Accent | null): CSSProperties | undefined {
  if (!accent) return undefined
  return {
    '--color-primary': accent.color,
    '--color-primary-foreground': accent.foreground,
    '--color-ring': accent.color,
  } as CSSProperties
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return [0, 0, l]
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = max === rn ? ((gn - bn) / d) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4
  return [(h * 60 + 360) % 360, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}
