const LOCALE = 'pt-BR'

const ratingFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 })
const integerFormat = new Intl.NumberFormat(LOCALE)
const dateFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'short', timeZone: 'UTC' })
const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'short', timeStyle: 'short' })
const currencyFormats = {
  USD: new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }),
  BRL: new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }),
}

export function formatRating(value: number | null): string {
  return value === null ? '—' : ratingFormat.format(value)
}

export function formatInteger(value: number): string {
  return integerFormat.format(value)
}

export function formatCurrency(value: number, currency: keyof typeof currencyFormats): string {
  return currencyFormats[currency].format(value)
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}min`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`
}

export function formatDate(isoDate: string): string {
  return dateFormat.format(new Date(isoDate))
}

export function formatDateTime(isoDateTime: string): string {
  const hasZone = /(?:Z|[+-]\d{2}:\d{2})$/.test(isoDateTime)
  return dateTimeFormat.format(new Date(hasZone ? isoDateTime : `${isoDateTime}Z`))
}
