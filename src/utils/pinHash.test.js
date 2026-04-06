import { describe, it, expect } from 'vitest'
import { hashSecurityPin, SECURITY_PIN_SALT_SUFFIX } from './pinHash.js'

describe('pinHash', () => {
  it('usa el sufijo compartido con el RPC SQL (no cambiar sin migración)', () => {
    expect(SECURITY_PIN_SALT_SUFFIX).toBe('_gestor_gastos_salt_2025')
  })

  it('produce un hex de 64 caracteres (SHA-256)', async () => {
    const h = await hashSecurityPin('123456')
    expect(h).toMatch(/^[0-9a-f]{64}$/)
  })

  it('es determinista para el mismo PIN', async () => {
    const a = await hashSecurityPin('000000')
    const b = await hashSecurityPin('000000')
    expect(a).toBe(b)
  })

  it('vector fijo: PIN 123456 (regresión alineada con Postgres pgcrypto)', async () => {
    const h = await hashSecurityPin('123456')
    expect(h).toBe(
      'e33eb40d1c0d0bd940f6ec8623da7226ebad0f89df5dde1e0d3151dcd678f3a7'
    )
  })
})
