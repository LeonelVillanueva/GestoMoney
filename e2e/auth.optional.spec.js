import { test, expect } from '@playwright/test'

/**
 * Solo se ejecuta si existen E2E_EMAIL y E2E_PASSWORD (usuario de prueba en Supabase).
 * No subas esas variables al repositorio; úsalas en local o en secretos de CI.
 */
const canRunAuth = !!(process.env.E2E_EMAIL && process.env.E2E_PASSWORD)

test.describe('Login E2E (opcional)', () => {
  test.beforeEach(() => {
    test.skip(!canRunAuth, 'Define E2E_EMAIL y E2E_PASSWORD para probar login real')
  })

  test('inicia sesión y muestra el área principal', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Email').fill(process.env.E2E_EMAIL)
    await page.getByLabel('Contraseña').fill(process.env.E2E_PASSWORD)
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()

    await expect(page.getByText('Dashboard', { exact: true })).toBeVisible({ timeout: 25000 })
    await expect(page.getByRole('button', { name: 'Cerrar Sesión' })).toBeVisible({ timeout: 10000 })
  })
})
