import { test, expect } from '@playwright/test'

test.describe('Smoke (sin credenciales)', () => {
  test('carga la app y muestra login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Gestor de Gastos/i)
    await expect(page.getByRole('heading', { name: 'Gestor de Gastos' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Contraseña')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible()
  })

  test('validación: email vacío muestra error', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
    await expect(page.getByText('Por favor, ingresa tu email')).toBeVisible()
  })
})
