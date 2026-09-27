import { describe, expect, it } from 'vitest'

import { pickAccent } from './color'

/** Imagem RGBA com `share` de pixels na cor dada e o resto em cinza escuro. */
function image(rgb: [number, number, number], share: number, size = 1000) {
  const pixels = new Uint8ClampedArray(size * 4)
  for (let i = 0; i < size; i++) {
    const [r, g, b] = i < size * share ? rgb : [40, 40, 40]
    pixels.set([r, g, b, 255], i * 4)
  }
  return pixels
}

describe('pickAccent', () => {
  it('ignora cinzas e fica com a cor do pôster, mesmo minoritária', () => {
    const accent = pickAccent(image([200, 30, 30], 0.2))

    expect(accent?.color).toMatch(/^rgb\(2\d\d \d{1,2} \d{1,2}\)$/)
  })

  it('pôster sem cor não gera acento (o tema neutro continua)', () => {
    expect(pickAccent(image([200, 30, 30], 0))).toBeNull()
    expect(pickAccent(image([200, 30, 30], 0.01))).toBeNull()
  })

  it('escolhe o texto mais legível sobre o acento', () => {
    expect(pickAccent(image([240, 200, 20], 0.5))?.foreground).toContain('0.17')
    expect(pickAccent(image([30, 40, 200], 0.5))?.foreground).toContain('0.99')
  })
})
