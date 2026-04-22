import { describe, expect, it } from 'vitest'
import {
  originAllowedForExchangeApi,
  parseAllowedOriginsCsv,
  resolveExchangeRateAllowedOrigins
} from './exchangeRateApiSecurity.js'

describe('parseAllowedOriginsCsv', () => {
  it('parsea lista separada por comas', () => {
    expect(parseAllowedOriginsCsv(' https://a.com ,https://b.com ')).toEqual([
      'https://a.com',
      'https://b.com'
    ])
  })
})

describe('resolveExchangeRateAllowedOrigins', () => {
  it('fusiona ALLOWED_ORIGINS con hosts de Vercel', () => {
    const list = resolveExchangeRateAllowedOrigins({
      ALLOWED_ORIGINS: 'https://app.example.com',
      VERCEL_URL: 'x.vercel.app'
    })
    expect(list).toContain('https://app.example.com')
    expect(list).toContain('https://x.vercel.app')
  })

  it('sin ALLOWED_ORIGINS añade host de Vercel', () => {
    const list = resolveExchangeRateAllowedOrigins({ VERCEL_URL: 'my.vercel.app' })
    expect(list).toEqual(['https://my.vercel.app'])
  })

  it('sin nada usa orígenes locales por defecto', () => {
    const list = resolveExchangeRateAllowedOrigins({})
    expect(list.some((o) => o.includes('localhost'))).toBe(true)
  })
})

describe('originAllowedForExchangeApi', () => {
  const allowed = ['https://app.com']

  it('permite petición sin cabecera Origin', () => {
    expect(originAllowedForExchangeApi(undefined, allowed)).toBe(true)
  })

  it('permite origen en la lista', () => {
    expect(originAllowedForExchangeApi('https://app.com', allowed)).toBe(true)
  })

  it('rechaza origen fuera de la lista', () => {
    expect(originAllowedForExchangeApi('https://evil.com', allowed)).toBe(false)
  })
})
