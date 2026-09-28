import { describe, expect, it } from 'vitest'

import { wrapDelta } from './trending-loop'

describe('wrapDelta', () => {
  it('põe o último slide à esquerda do primeiro (a roda fecha)', () => {
    expect(wrapDelta(9 - 0, 10)).toBe(-1)
    expect(wrapDelta(0 - 9, 10)).toBe(1)
  })

  it('escolhe o caminho mais curto também com posição acumulada de várias voltas', () => {
    expect(wrapDelta(2 - 23, 10)).toBe(-1)
    expect(wrapDelta(3 - -18.5, 10)).toBeCloseTo(1.5)
  })

  it('cada slide aparece uma vez só: metade de cada lado', () => {
    const deltas = Array.from({ length: 10 }, (_, index) => wrapDelta(index - 0, 10))
    expect(deltas.sort((a, b) => a - b)).toEqual([-4, -3, -2, -1, 0, 1, 2, 3, 4, 5])
  })
})
