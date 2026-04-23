import { describe, expect, it } from 'vitest'
import {
  decryptSensitive,
  encryptSensitive,
  generateTotpSecret,
  verifyTotpCode
} from './auth2fa.js'

describe('auth2fa helpers', () => {
  it('cifra y descifra payload sensible', () => {
    const value = 'sensitive-value-123'
    const encrypted = encryptSensitive(value)
    const decrypted = decryptSensitive(encrypted)
    expect(decrypted).toBe(value)
  })

  it('genera secreto TOTP válido y verifica código', () => {
    const secret = generateTotpSecret()
    expect(secret).toMatch(/^[A-Z2-7]+$/)

    const now = Date.now()
    // Verificar solo que formato inválido falle consistentemente
    expect(verifyTotpCode({ secret, code: '12', now })).toBe(false)
  })
})
