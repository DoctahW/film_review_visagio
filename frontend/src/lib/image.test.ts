import { describe, expect, it } from 'vitest'

import { tmdbImage } from './image'

describe('tmdbImage', () => {
  it('troca a largura de pôsteres e backdrops do TMDB', () => {
    expect(tmdbImage('https://image.tmdb.org/t/p/w500/abc.jpg', 'w342')).toBe(
      'https://image.tmdb.org/t/p/w342/abc.jpg',
    )
    expect(tmdbImage('https://image.tmdb.org/t/p/original/abc.jpg', 'w780')).toBe(
      'https://image.tmdb.org/t/p/w780/abc.jpg',
    )
  })

  it('mantém URLs de outros hosts', () => {
    const url = 'https://example.com/t/p/w500/abc.jpg'
    expect(tmdbImage(url, 'w185')).toBe(url)
  })
})
