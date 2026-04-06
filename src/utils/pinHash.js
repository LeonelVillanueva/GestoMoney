/**
 * Hash SHA-256 del PIN (mismo algoritmo que verify_security_pin en Postgres).
 * El sufijo debe coincidir con el literal en supabase/migrations/*verify_security_pin*.sql
 */
export const SECURITY_PIN_SALT_SUFFIX = '_gestor_gastos_salt_2025'

export async function hashSecurityPin(pin) {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + SECURITY_PIN_SALT_SUFFIX)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
