import { describe, expect, it } from 'vitest'

import { formatDate, formatDateTime, formatDuration, formatRating } from './format'

// Os testes rodam em America/Sao_Paulo (UTC-3), configurado em vite.config.ts.

describe('formatRating', () => {
  it('usa vírgula e no máximo uma casa', () => {
    expect(formatRating(8.2)).toBe('8,2')
    expect(formatRating(10)).toBe('10')
    expect(formatRating(0)).toBe('0')
  })

  it('mostra travessão sem avaliação', () => {
    expect(formatRating(null)).toBe('—')
  })
})

describe('formatDate', () => {
  it('não recua um dia em fuso negativo', () => {
    expect(formatDate('2019-02-21')).toBe('21/02/2019')
  })
})

describe('formatDateTime', () => {
  it('lê datetime sem fuso da API como UTC', () => {
    expect(formatDateTime('2026-09-24T19:55:05')).toBe('24/09/2026, 16:55')
  })

  it('respeita fuso explícito', () => {
    expect(formatDateTime('2026-09-24T19:55:05Z')).toBe('24/09/2026, 16:55')
    expect(formatDateTime('2026-09-24T19:55:05-03:00')).toBe('24/09/2026, 19:55')
  })
})

describe('formatDuration', () => {
  it('omite a parte zerada', () => {
    expect(formatDuration(45)).toBe('45min')
    expect(formatDuration(120)).toBe('2h')
    expect(formatDuration(135)).toBe('2h 15min')
  })
})
