import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockUpsert = vi.fn()
const mockFrom = vi.fn()

vi.mock('./supabase.js', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser()
    },
    from: (...args) => mockFrom(...args)
  }
}))

import SupabaseDatabase from './supabaseDatabase.js'

describe('SupabaseDatabase', () => {
  let db

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: '11111111-1111-1111-1111-111111111111' } } })
    mockUpsert.mockResolvedValue({ error: null })
    mockFrom.mockImplementation((table) => {
      if (table === 'config') {
        return {
          upsert: (...args) => mockUpsert(...args)
        }
      }
      if (table === 'categories') {
        return {
          select: () => ({
            limit: () => Promise.resolve({ error: null })
          })
        }
      }
      return {}
    })
    db = new SupabaseDatabase()
  })

  describe('init', () => {
    it('completa cuando la consulta no falla', async () => {
      await expect(db.init()).resolves.toBe(true)
    })

    it('no lanza si el único error es PGRST116 (sin filas)', async () => {
      mockFrom.mockImplementation((table) => {
        if (table === 'categories') {
          return {
            select: () => ({
              limit: () => Promise.resolve({ error: { code: 'PGRST116', message: 'No rows' } })
            })
          }
        }
        return {}
      })
      db = new SupabaseDatabase()
      await expect(db.init()).resolves.toBe(true)
    })

    it('lanza con pista si falla la red', async () => {
      mockFrom.mockImplementation((table) => {
        if (table === 'categories') {
          return {
            select: () => ({
              limit: () =>
                Promise.resolve({
                  error: { message: 'TypeError: Failed to fetch', code: undefined }
                })
            })
          }
        }
        return {}
      })
      db = new SupabaseDatabase()
      await expect(db.init()).rejects.toThrow(/Failed to fetch|conexión|pausado|SUPABASE/i)
    })
  })

  describe('setConfig', () => {
    it('sin sesión y silentIfNoSession: devuelve false y no hace upsert', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      const r = await db.setConfig('k', 'v', '', { silentIfNoSession: true })
      expect(r).toBe(false)
      expect(mockUpsert).not.toHaveBeenCalled()
    })

    it('sin sesión y sin silent: lanza', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      await expect(db.setConfig('k', 'v')).rejects.toThrow('No hay sesión activa')
    })

    it('con sesión: upsert con user_id y onConflict user_id,key', async () => {
      await db.setConfig('tasa_cambio_usd', '26.5')
      expect(mockUpsert).toHaveBeenCalledWith(
        {
          user_id: '11111111-1111-1111-1111-111111111111',
          key: 'tasa_cambio_usd',
          value: '26.5',
          description: ''
        },
        { onConflict: 'user_id,key' }
      )
    })
  })
})
