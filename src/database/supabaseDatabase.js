import { supabase } from './supabase.js'

/**
 * Misma intención que AuthContext, pero excl. Vitest: allí el cliente mockeado no tiene
 * `fetch` a una URL relativa y no hay cookies de API.
 */
const USE_SERVER_CONFIG_SAVE =
  (import.meta.env.PROD || import.meta.env.VITE_USE_HTTPONLY_AUTH === 'true') && import.meta.env.MODE !== 'test'

class SupabaseDatabase {
  constructor() {
    this.initialized = false
  }

  async init() {
    const { error } = await supabase.from('categories').select('count').limit(1)
    if (error && error.code !== 'PGRST116') { // PGRST116 = tabla vacía, es OK
      const msg = error.message || String(error)
      const hint =
        /fetch|network|failed to fetch/i.test(msg)
          ? ' Comprueba conexión, que el proyecto Supabase no esté pausado y las variables SUPABASE_PROYECT_URL / SUPABASE_ANON_PUBLIC en .env.'
          : ''
      throw new Error(`Error conectando a Supabase: ${msg}${hint}`)
    }
    this.initialized = true
    return true
  }

  close() {
    this.initialized = false
  }

  // ============================================
  // GASTOS (Expenses)
  // ============================================

  async createExpense(expenseData) {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        fecha: expenseData.fecha,
        monto: expenseData.monto,
        categoria_id: expenseData.categoria_id,
        descripcion: expenseData.descripcion || '',
        es_entrada: expenseData.es_entrada || false,
        moneda_original: expenseData.moneda_original || 'LPS',
        tasa_cambio_usada: expenseData.tasa_cambio_usada || null
      })
      .select('*, categories(*)')
      .single()

    if (error) throw error

    return {
      ...data,
      categoria_nombre: data.categories?.nombre,
      categoria_icon: data.categories?.icon,
      categoria_color: data.categories?.color
    }
  }

  async getExpenses(filters = {}) {
    let query = supabase
      .from('expenses')
      .select('*, categories(*)')
      .order('created_at', { ascending: false })

    if (filters.fechaDesde) {
      query = query.gte('fecha', filters.fechaDesde)
    }
    if (filters.fechaHasta) {
      query = query.lte('fecha', filters.fechaHasta)
    }
    if (filters.categoria_id) {
      query = query.eq('categoria_id', filters.categoria_id)
    }

    const { data, error } = await query
    if (error) throw error

    return data.map(expense => ({
      ...expense,
      categoria_nombre: expense.categories?.nombre,
      categoria_icon: expense.categories?.icon,
      categoria_color: expense.categories?.color
    }))
  }

  async getExpenseById(id) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*, categories(*)')
      .eq('id', id)
      .single()

    if (error) throw error

    return {
      ...data,
      categoria_nombre: data.categories?.nombre,
      categoria_icon: data.categories?.icon,
      categoria_color: data.categories?.color
    }
  }

  async updateExpense(id, expenseData) {
    const { data, error } = await supabase
      .from('expenses')
      .update({
        fecha: expenseData.fecha,
        monto: expenseData.monto,
        categoria_id: expenseData.categoria_id,
        descripcion: expenseData.descripcion || '',
        es_entrada: expenseData.es_entrada || false,
        moneda_original: expenseData.moneda_original || 'LPS'
      })
      .eq('id', id)
      .select('*, categories(*)')
      .single()

    if (error) throw error

    return {
      ...data,
      categoria_nombre: data.categories?.nombre,
      categoria_icon: data.categories?.icon,
      categoria_color: data.categories?.color
    }
  }

  async deleteExpense(id) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }

  // ============================================
  // CATEGORÍAS (Categories)
  // ============================================

  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('activa', true)
      .order('nombre')

    if (error) throw error

    return data.map(cat => ({
      id: cat.id,
      name: cat.nombre,
      color: cat.color,
      icon: cat.icon,
      description: cat.descripcion,
      created_at: cat.created_at
    }))
  }

  async createCategory(categoryData) {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        nombre: categoryData.name || categoryData.nombre,
        descripcion: categoryData.description || categoryData.descripcion || '',
        color: categoryData.color || '#3498db',
        icon: categoryData.icon || '💰',
        activa: true
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      name: data.nombre,
      color: data.color,
      icon: data.icon,
      description: data.descripcion,
      created_at: data.created_at
    }
  }

  async updateCategory(categoryId, updates) {
    const { data, error } = await supabase
      .from('categories')
      .update({
        nombre: updates.name || updates.nombre,
        descripcion: updates.description || updates.descripcion,
        color: updates.color,
        icon: updates.icon,
        activa: updates.activa
      })
      .eq('id', categoryId)
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      name: data.nombre,
      color: data.color,
      icon: data.icon,
      description: data.descripcion,
      created_at: data.created_at
    }
  }

  async deleteCategory(categoryId) {
    const { error } = await supabase
      .from('categories')
      .update({ activa: false })
      .eq('id', categoryId)

    if (error) throw error
    return true
  }

  // ============================================
  // SUPERMERCADOS (Supermarket Purchases)
  // ============================================

  async createSupermarketPurchase(purchaseData) {
    const { data, error } = await supabase
      .from('supermarket_purchases')
      .insert({
        fecha: purchaseData.fecha,
        monto: purchaseData.monto,
        supermercado: purchaseData.supermercado,
        descripcion: purchaseData.descripcion || ''
      })
      .select()
      .single()

    if (error) throw error
    return data.id
  }

  async getSupermarketPurchases(filters = {}) {
    let query = supabase
      .from('supermarket_purchases')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.fechaDesde) {
      query = query.gte('fecha', filters.fechaDesde)
    }
    if (filters.fechaHasta) {
      query = query.lte('fecha', filters.fechaHasta)
    }
    if (filters.supermercado) {
      query = query.eq('supermercado', filters.supermercado)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async updateSupermarketPurchase(id, purchaseData) {
    const { data, error } = await supabase
      .from('supermarket_purchases')
      .update({
        fecha: purchaseData.fecha,
        monto: purchaseData.monto,
        supermercado: purchaseData.supermercado,
        descripcion: purchaseData.descripcion || ''
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteSupermarketPurchase(id) {
    const { error } = await supabase
      .from('supermarket_purchases')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }

  // ============================================
  // CORTES (Cuts)
  // ============================================

  async createCut(cutData) {
    const { data, error } = await supabase
      .from('cuts')
      .insert({
        fecha: cutData.fecha,
        monto: cutData.monto || 0,
        tipo_corte: cutData.tipo_corte,
        descripcion: cutData.descripcion || ''
      })
      .select()
      .single()

    if (error) throw error
    return data.id
  }

  async getCuts(filters = {}) {
    let query = supabase
      .from('cuts')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.fechaDesde) {
      query = query.gte('fecha', filters.fechaDesde)
    }
    if (filters.fechaHasta) {
      query = query.lte('fecha', filters.fechaHasta)
    }
    if (filters.tipo_corte) {
      query = query.eq('tipo_corte', filters.tipo_corte)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async updateCut(id, cutData) {
    const { data, error } = await supabase
      .from('cuts')
      .update({
        fecha: cutData.fecha,
        monto: cutData.monto || 0,
        tipo_corte: cutData.tipo_corte,
        descripcion: cutData.descripcion || ''
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteCut(id) {
    const { error } = await supabase
      .from('cuts')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }

  // ============================================
  // CONFIGURACIÓN (Config)
  // ============================================

  async getConfig(key) {
    if (USE_SERVER_CONFIG_SAVE) {
      try {
        const res = await fetch(`/api/account/config?key=${encodeURIComponent(String(key))}`, {
          credentials: 'include'
        })
        if (res.status === 401) return null
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) return null
        return payload?.value ?? null
      } catch {
        return null
      }
    }

    const { data, error } = await supabase
      .from('config')
      .select('value')
      .eq('key', key)
      .maybeSingle()

    if (error) throw error
    return data?.value || null
  }

  /**
   * Guarda clave en config (por usuario).
   * @param {{ silentIfNoSession?: boolean }} [options] — si true, sin sesión devuelve false en lugar de lanzar (p. ej. tasa al arrancar).
   */
  async setConfig(key, value, description = '', options = {}) {
    const { silentIfNoSession = false } = options

    if (USE_SERVER_CONFIG_SAVE) {
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value)
      try {
        const res = await fetch('/api/account/config', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value: valueStr, description: description || '' })
        })
        const payload = await res.json().catch(() => ({}))
        if (res.status === 401) {
          if (silentIfNoSession) return false
          throw new Error('No hay sesión activa')
        }
        if (!res.ok || !payload?.ok) {
          const msg = typeof payload?.error === 'string' ? payload.error : 'No se pudo guardar la configuración'
          throw new Error(msg)
        }
        return true
      } catch (e) {
        if (silentIfNoSession && e && typeof e.message === 'string' && e.message.includes('sesión')) {
          return false
        }
        throw e
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      if (silentIfNoSession) return false
      throw new Error('No hay sesión activa')
    }

    const payload = {
      user_id: user.id,
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
      description
    }

    // Evita depender de UNIQUE(user_id,key): primero intenta UPDATE y, si no existe fila, hace INSERT.
    const { data: updatedRows, error: updateError } = await supabase
      .from('config')
      .update({
        value: payload.value,
        description: payload.description
      })
      .eq('user_id', user.id)
      .eq('key', key)
      .select('key')

    if (updateError) throw updateError
    if (Array.isArray(updatedRows) && updatedRows.length > 0) return true

    const { error: insertError } = await supabase
      .from('config')
      .insert(payload)

    if (!insertError) return true

    // Compatibilidad con esquemas legacy donde `key` es PK/UNIQUE global (ej: config_pkey).
    if (insertError.code === '23505') {
      const { data: migratedRows, error: migrateError } = await supabase
        .from('config')
        .update({
          user_id: user.id,
          value: payload.value,
          description: payload.description
        })
        .eq('key', key)
        .select('key')

      if (migrateError) throw migrateError
      if (Array.isArray(migratedRows) && migratedRows.length > 0) return true
    }

    throw insertError
    return true
  }

  async getAllConfig() {
    if (USE_SERVER_CONFIG_SAVE) {
      try {
        const res = await fetch('/api/account/config', { credentials: 'include' })
        if (res.status === 401) return {}
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) return {}
        const c = payload?.config
        return c && typeof c === 'object' ? c : {}
      } catch {
        return {}
      }
    }

    const { data, error } = await supabase
      .from('config')
      .select('*')

    if (error) throw error

    const config = {}
    data.forEach(item => {
      config[item.key] = item.value
    })
    return config
  }

  // ============================================
  // PRESUPUESTOS (Budgets)
  // ============================================

  async createBudget(budgetData) {
    // Verificar si ya existe un presupuesto exactamente igual (misma combinación de categorías y mes)
    const { data: existing } = await supabase
      .from('budgets')
      .select('id')
      .eq('category', budgetData.category)
      .eq('month', budgetData.month)
      .maybeSingle()

    if (existing) {
      // Si ya existe, actualizar en lugar de crear uno nuevo
      const { data, error } = await supabase
        .from('budgets')
        .update({
          amount: budgetData.amount,
          updated_at: new Date().toISOString()
        })
        .eq('category', budgetData.category)
        .eq('month', budgetData.month)
        .select()
        .single()

      if (error) throw error
      return data.id
    }

    // Si no existe, crear uno nuevo
    const { data, error } = await supabase
      .from('budgets')
      .insert({
        category: budgetData.category,
        amount: budgetData.amount,
        month: budgetData.month
      })
      .select()
      .single()

    if (error) throw error
    return data.id
  }

  async getBudgets(month) {
    let query = supabase
      .from('budgets')
      .select('*')
    
    if (month !== null && month !== undefined) {
      query = query.eq('month', month)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  async updateBudget(budgetId, updates) {
    const { error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', budgetId)

    if (error) throw error
    return true
  }

  async deleteBudget(budgetId) {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', budgetId)

    if (error) throw error
    return true
  }

  // ============================================
  // ESTADÍSTICAS (Stats)
  // ============================================

  async getExpenseStats(filters = {}) {
    const expenses = await this.getExpenses(filters)
    
    const stats = {
      total: 0,
      cantidad: expenses.length,
      promedio: 0,
      maximo: 0,
      minimo: Infinity,
      por_categoria: {}
    }

    expenses.forEach(expense => {
      const monto = parseFloat(expense.monto) || 0
      stats.total += monto
      stats.maximo = Math.max(stats.maximo, monto)
      stats.minimo = Math.min(stats.minimo, monto)
      
      const categoria = expense.categoria_nombre || 'Desconocida'
      if (!stats.por_categoria[categoria]) {
        stats.por_categoria[categoria] = { cantidad: 0, total: 0 }
      }
      stats.por_categoria[categoria].cantidad++
      stats.por_categoria[categoria].total += monto
    })

    stats.promedio = stats.cantidad > 0 ? stats.total / stats.cantidad : 0
    stats.minimo = stats.minimo === Infinity ? 0 : stats.minimo

    return stats
  }

  async getExpensesByCategory(filters = {}) {
    const expenses = await this.getExpenses(filters)
    const stats = {}

    expenses.forEach(expense => {
      const categoria = expense.categoria_nombre || 'Desconocida'
      if (!stats[categoria]) {
        stats[categoria] = { cantidad: 0, total: 0 }
      }
      stats[categoria].cantidad++
      stats[categoria].total += parseFloat(expense.monto) || 0
    })

    return Object.entries(stats).map(([categoria, data]) => ({
      categoria,
      cantidad: data.cantidad,
      total: data.total
    })).sort((a, b) => b.total - a.total)
  }

  // ============================================
  // BACKUP/EXPORT
  // ============================================

  async exportAll() {
    try {
      // Obtener todos los datos de todas las tablas
      const [expenses, categories, supermarketPurchases, cuts, budgets, config] = await Promise.all([
        this.getExpenses({}),
        this.getCategories(),
        this.getSupermarketPurchases({}),
        this.getCuts({}),
        this.getBudgets(null),
        this.getAllConfig()
      ])

      return {
        version: '1.0',
        exportDate: new Date().toISOString(),
        expenses: expenses || [],
        categories: categories || [],
        supermarketPurchases: supermarketPurchases || [],
        cuts: cuts || [],
        budgets: budgets || [],
        config: config || {}
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      throw error
    }
  }

  async importAll(payload) {
    try {
      if (!payload || typeof payload !== 'object') {
        return false
      }

      // Limpiar datos existentes (opcional, dependiendo de la estrategia)
      // Por ahora, importamos sin limpiar para permitir merge

      // Importar categorías primero (necesarias para gastos)
      if (payload.categories && Array.isArray(payload.categories)) {
        for (const cat of payload.categories) {
          try {
            await this.createCategory({
              name: cat.name || cat.nombre,
              color: cat.color,
              icon: cat.icon,
              description: cat.description || cat.descripcion
            })
          } catch (err) {
            // Si ya existe, intentar actualizar
            if (cat.id) {
              try {
                await this.updateCategory(cat.id, {
                  name: cat.name || cat.nombre,
                  color: cat.color,
                  icon: cat.icon,
                  description: cat.description || cat.descripcion
                })
              } catch (updateErr) {
                console.warn('No se pudo importar categoría:', cat.name, updateErr)
              }
            }
          }
        }
      }

      // Importar gastos
      if (payload.expenses && Array.isArray(payload.expenses)) {
        for (const expense of payload.expenses) {
          try {
            // Buscar categoría por nombre si no hay ID
            let categoria_id = expense.categoria_id
            if (!categoria_id && expense.categoria_nombre) {
              const cats = await this.getCategories()
              const foundCat = cats.find(c => c.name === expense.categoria_nombre)
              if (foundCat) categoria_id = foundCat.id
            }

            if (categoria_id) {
              await this.createExpense({
                fecha: expense.fecha,
                monto: expense.monto,
                categoria_id: categoria_id,
                descripcion: expense.descripcion || '',
                es_entrada: expense.es_entrada || false,
                moneda_original: expense.moneda_original || 'LPS'
              })
            }
          } catch (err) {
            console.warn('No se pudo importar gasto:', err)
          }
        }
      }

      // Importar compras de supermercado
      if (payload.supermarketPurchases && Array.isArray(payload.supermarketPurchases)) {
        for (const purchase of payload.supermarketPurchases) {
          try {
            await this.createSupermarketPurchase({
              fecha: purchase.fecha,
              monto: purchase.monto || purchase.monto_total,
              supermercado: purchase.supermercado,
              descripcion: purchase.descripcion || ''
            })
          } catch (err) {
            console.warn('No se pudo importar compra:', err)
          }
        }
      }

      // Importar cortes
      if (payload.cuts && Array.isArray(payload.cuts)) {
        for (const cut of payload.cuts) {
          try {
            await this.createCut({
              fecha: cut.fecha,
              tipo_corte: cut.tipo_corte,
              monto: cut.monto || cut.precio || 0,
              descripcion: cut.descripcion || ''
            })
          } catch (err) {
            console.warn('No se pudo importar corte:', err)
          }
        }
      }

      // Importar presupuestos
      if (payload.budgets && Array.isArray(payload.budgets)) {
        for (const budget of payload.budgets) {
          try {
            // Los presupuestos se almacenan como registros individuales por categoría
            await this.createBudget({
              category: budget.category,
              amount: budget.amount,
              month: budget.month
            })
          } catch (err) {
            console.warn('No se pudo importar presupuesto:', err)
          }
        }
      }

      // Importar configuración
      if (payload.config && typeof payload.config === 'object') {
        for (const [key, value] of Object.entries(payload.config)) {
          try {
            await this.setConfig(key, value)
          } catch (err) {
            console.warn('No se pudo importar configuración:', key, err)
          }
        }
      }

      return true
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }

  // ============================================
  // SNAPSHOTS (Mini backups rápidos en localStorage)
  // ============================================

  _getSnapshotsIndex() {
    try {
      const stored = localStorage.getItem('gestor_gastos_snapshots_index')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading snapshots index:', error)
      return []
    }
  }

  _saveSnapshotsIndex(index) {
    try {
      localStorage.setItem('gestor_gastos_snapshots_index', JSON.stringify(index))
    } catch (error) {
      console.error('Error saving snapshots index:', error)
      throw error
    }
  }

  async listSnapshots() {
    try {
      const index = this._getSnapshotsIndex()
      const snapshots = []

      for (const snapshotInfo of index) {
        try {
          const snapshotData = localStorage.getItem(`gestor_gastos_snapshot_${snapshotInfo.id}`)
          if (snapshotData) {
            const data = JSON.parse(snapshotData)
            snapshots.push({
              id: snapshotInfo.id,
              createdAt: snapshotInfo.createdAt,
              sizeBytes: snapshotInfo.sizeBytes,
              totalRecords: snapshotInfo.totalRecords,
              data: data // Incluir datos para descarga
            })
          }
        } catch (err) {
          console.warn('Error reading snapshot:', snapshotInfo.id, err)
        }
      }

      // Ordenar por fecha más reciente primero
      return snapshots.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } catch (error) {
      console.error('Error listing snapshots:', error)
      return []
    }
  }

  async createSnapshot() {
    try {
      // Exportar todos los datos
      const allData = await this.exportAll()

      // Calcular estadísticas
      const totalRecords = 
        (allData.expenses?.length || 0) +
        (allData.categories?.length || 0) +
        (allData.supermarketPurchases?.length || 0) +
        (allData.cuts?.length || 0) +
        (allData.budgets?.length || 0)

      const dataString = JSON.stringify(allData)
      const sizeBytes = new Blob([dataString]).size

      // Generar ID único
      const id = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const createdAt = new Date().toISOString()

      // Guardar snapshot en localStorage
      localStorage.setItem(`gestor_gastos_snapshot_${id}`, dataString)

      // Actualizar índice
      const index = this._getSnapshotsIndex()
      index.push({
        id,
        createdAt,
        sizeBytes,
        totalRecords
      })

      // Limitar a 50 snapshots (eliminar los más antiguos)
      if (index.length > 50) {
        const sorted = index.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        const toRemove = sorted.slice(0, index.length - 50)
        for (const oldSnap of toRemove) {
          localStorage.removeItem(`gestor_gastos_snapshot_${oldSnap.id}`)
        }
        index.splice(0, index.length - 50)
      }

      this._saveSnapshotsIndex(index)

      return {
        id,
        createdAt,
        sizeBytes,
        totalRecords
      }
    } catch (error) {
      console.error('Error creating snapshot:', error)
      throw error
    }
  }

  async deleteSnapshot(id) {
    try {
      // Eliminar snapshot de localStorage
      localStorage.removeItem(`gestor_gastos_snapshot_${id}`)

      // Actualizar índice
      const index = this._getSnapshotsIndex()
      const filtered = index.filter(snap => snap.id !== id)
      this._saveSnapshotsIndex(filtered)

      return true
    } catch (error) {
      console.error('Error deleting snapshot:', error)
      return false
    }
  }

  /**
   * Valida la estructura y contenido de un snapshot
   * @param {Object} data - Datos del snapshot a validar
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  _validateSnapshot(data) {
    const errors = []

    // Validar estructura básica
    if (!data || typeof data !== 'object') {
      errors.push('El snapshot no es un objeto válido')
      return { valid: false, errors }
    }

    // Validar version
    if (!data.version || typeof data.version !== 'string') {
      errors.push('El snapshot no tiene una versión válida')
    }

    // Validar arrays requeridos
    const requiredArrays = ['expenses', 'categories', 'supermarketPurchases', 'cuts', 'budgets']
    for (const key of requiredArrays) {
      if (!Array.isArray(data[key])) {
        errors.push(`El campo '${key}' debe ser un array`)
      }
    }

    // Validar config
    if (data.config && typeof data.config !== 'object') {
      errors.push('El campo "config" debe ser un objeto')
    }

    // Validar estructura de categorías
    if (Array.isArray(data.categories)) {
      data.categories.forEach((cat, idx) => {
        if (!cat.name && !cat.nombre) {
          errors.push(`Categoría ${idx}: falta nombre`)
        }
        if (cat.color && typeof cat.color !== 'string') {
          errors.push(`Categoría ${idx}: color inválido`)
        }
        if (cat.icon && typeof cat.icon !== 'string') {
          errors.push(`Categoría ${idx}: icono inválido`)
        }
      })
    }

    // Validar estructura de gastos
    if (Array.isArray(data.expenses)) {
      data.expenses.forEach((exp, idx) => {
        if (!exp.fecha) {
          errors.push(`Gasto ${idx}: falta fecha`)
        }
        if (exp.monto === undefined || exp.monto === null || isNaN(parseFloat(exp.monto))) {
          errors.push(`Gasto ${idx}: monto inválido`)
        }
        if (!exp.categoria_id && !exp.categoria_nombre) {
          errors.push(`Gasto ${idx}: falta categoría`)
        }
      })
    }

    // Validar estructura de compras de supermercado
    if (Array.isArray(data.supermarketPurchases)) {
      data.supermarketPurchases.forEach((purchase, idx) => {
        if (!purchase.fecha) {
          errors.push(`Compra ${idx}: falta fecha`)
        }
        if (purchase.monto === undefined && purchase.monto_total === undefined) {
          errors.push(`Compra ${idx}: falta monto`)
        }
        if (!purchase.supermercado) {
          errors.push(`Compra ${idx}: falta supermercado`)
        }
      })
    }

    // Validar estructura de cortes
    if (Array.isArray(data.cuts)) {
      data.cuts.forEach((cut, idx) => {
        if (!cut.fecha) {
          errors.push(`Corte ${idx}: falta fecha`)
        }
        if (!cut.tipo_corte) {
          errors.push(`Corte ${idx}: falta tipo de corte`)
        }
      })
    }

    // Validar estructura de presupuestos
    if (Array.isArray(data.budgets)) {
      data.budgets.forEach((budget, idx) => {
        if (!budget.category) {
          errors.push(`Presupuesto ${idx}: falta categoría`)
        }
        if (budget.amount === undefined || isNaN(parseFloat(budget.amount))) {
          errors.push(`Presupuesto ${idx}: monto inválido`)
        }
        if (!budget.month || !/^\d{4}-\d{2}$/.test(budget.month)) {
          errors.push(`Presupuesto ${idx}: formato de mes inválido (debe ser YYYY-MM)`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Verifica la conexión con Supabase
   * @returns {Promise<{connected: boolean, error?: string}>}
   */
  async _verifySupabaseConnection() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('count')
        .limit(1)

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = tabla vacía, es OK
        return {
          connected: false,
          error: `Error de conexión: ${error.message}`
        }
      }

      return { connected: true }
    } catch (error) {
      return {
        connected: false,
        error: `Error al verificar conexión: ${error.message}`
      }
    }
  }

  /**
   * Crea un snapshot de seguridad automático antes de restaurar
   * @returns {Promise<{success: boolean, backupId?: string, error?: string}>}
   */
  async _createSafetyBackup() {
    try {
      const backupId = `safety_backup_${Date.now()}`
      const allData = await this.exportAll()
      const dataString = JSON.stringify(allData)
      
      // Guardar en localStorage con prefijo especial
      localStorage.setItem(`gestor_gastos_safety_backup_${backupId}`, dataString)
      
      // También guardar metadatos
      const backupInfo = {
        id: backupId,
        createdAt: new Date().toISOString(),
        sizeBytes: new Blob([dataString]).size,
        totalRecords: 
          (allData.expenses?.length || 0) +
          (allData.categories?.length || 0) +
          (allData.supermarketPurchases?.length || 0) +
          (allData.cuts?.length || 0) +
          (allData.budgets?.length || 0)
      }
      
      localStorage.setItem('gestor_gastos_last_safety_backup', JSON.stringify(backupInfo))
      
      return { success: true, backupId }
    } catch (error) {
      return {
        success: false,
        error: `Error al crear backup de seguridad: ${error.message}`
      }
    }
  }

  /**
   * Restaura desde un backup de seguridad
   * @param {string} backupId - ID del backup de seguridad
   * @returns {Promise<boolean>}
   */
  async _restoreFromSafetyBackup(backupId) {
    try {
      const backupData = localStorage.getItem(`gestor_gastos_safety_backup_${backupId}`)
      if (!backupData) {
        console.error('Backup de seguridad no encontrado:', backupId)
        return false
      }

      const data = JSON.parse(backupData)
      await this.clearAllData()
      return await this.importAll(data)
    } catch (error) {
      console.error('Error restaurando desde backup de seguridad:', error)
      return false
    }
  }

  /**
   * Valida que la restauración fue exitosa comparando conteos
   * @param {Object} snapshotData - Datos del snapshot restaurado
   * @returns {Promise<{valid: boolean, errors: string[]}>}
   */
  async _validateRestoration(snapshotData) {
    const errors = []
    
    try {
      // Obtener datos actuales de Supabase
      const [currentExpenses, currentCategories, currentPurchases, currentCuts, currentBudgets] = await Promise.all([
        this.getExpenses({}),
        this.getCategories(),
        this.getSupermarketPurchases({}),
        this.getCuts({}),
        this.getBudgets(null)
      ])

      // Comparar conteos (con tolerancia del 5% por posibles errores menores)
      const snapshotCounts = {
        expenses: snapshotData.expenses?.length || 0,
        categories: snapshotData.categories?.length || 0,
        purchases: snapshotData.supermarketPurchases?.length || 0,
        cuts: snapshotData.cuts?.length || 0,
        budgets: snapshotData.budgets?.length || 0
      }

      const currentCounts = {
        expenses: currentExpenses.length,
        categories: currentCategories.length,
        purchases: currentPurchases.length,
        cuts: currentCuts.length,
        budgets: currentBudgets.length
      }

      // Validar que los conteos sean razonables (al menos 80% de coincidencia)
      const tolerance = 0.2 // 20% de tolerancia
      const types = ['expenses', 'categories', 'purchases', 'cuts', 'budgets']
      const typeNames = {
        expenses: 'gastos',
        categories: 'categorías',
        purchases: 'compras',
        cuts: 'cortes',
        budgets: 'presupuestos'
      }

      for (const type of types) {
        const expected = snapshotCounts[type]
        const actual = currentCounts[type]
        
        if (expected > 0) {
          const diff = Math.abs(actual - expected) / expected
          if (diff > tolerance) {
            errors.push(
              `${typeNames[type]}: se esperaban ${expected} pero se encontraron ${actual} (diferencia: ${(diff * 100).toFixed(1)}%)`
            )
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        counts: { snapshot: snapshotCounts, current: currentCounts }
      }
    } catch (error) {
      errors.push(`Error al validar restauración: ${error.message}`)
      return { valid: false, errors }
    }
  }

  /**
   * Restaura un snapshot con validaciones estrictas y sistema de seguridad
   * @param {string} id - ID del snapshot a restaurar
   * @returns {Promise<{success: boolean, errors?: string[], backupId?: string}>}
   */
  async restoreSnapshot(id) {
    const validationErrors = []
    let safetyBackupId = null

    try {
      // PASO 1: Verificar que el snapshot existe
      const snapshotData = localStorage.getItem(`gestor_gastos_snapshot_${id}`)
      if (!snapshotData) {
        return {
          success: false,
          errors: ['El snapshot no existe en el almacenamiento local']
        }
      }

      // PASO 2: Parsear y validar estructura JSON
      let data
      try {
        data = JSON.parse(snapshotData)
      } catch (parseError) {
        return {
          success: false,
          errors: [`El snapshot está corrupto (JSON inválido): ${parseError.message}`]
        }
      }

      // PASO 3: Validar estructura y contenido del snapshot
      const validation = this._validateSnapshot(data)
      if (!validation.valid) {
        return {
          success: false,
          errors: ['Errores de validación en el snapshot:', ...validation.errors]
        }
      }

      // PASO 3.5: Validar integridad referencial (categorías)
      if (Array.isArray(data.expenses) && Array.isArray(data.categories)) {
        const categoryNames = new Set(data.categories.map(c => (c.name || c.nombre).toLowerCase().trim()))
        const categoryIds = new Set(data.categories.map(c => c.id).filter(Boolean))
        
        const missingCategories = []
        data.expenses.forEach((exp, idx) => {
          if (exp.categoria_id && !categoryIds.has(exp.categoria_id)) {
            missingCategories.push(`Gasto ${idx}: categoría con ID ${exp.categoria_id} no existe en el snapshot`)
          }
          if (exp.categoria_nombre && !categoryNames.has((exp.categoria_nombre || '').toLowerCase().trim())) {
            missingCategories.push(`Gasto ${idx}: categoría "${exp.categoria_nombre}" no existe en el snapshot`)
          }
        })
        
        if (missingCategories.length > 0) {
          return {
            success: false,
            errors: ['Errores de integridad referencial:', ...missingCategories.slice(0, 10)]
          }
        }
      }

      // PASO 4: Verificar conexión con Supabase
      const connectionCheck = await this._verifySupabaseConnection()
      if (!connectionCheck.connected) {
        return {
          success: false,
          errors: [`No se puede conectar a Supabase: ${connectionCheck.error}`]
        }
      }

      // PASO 5: Crear backup de seguridad automático
      const backupResult = await this._createSafetyBackup()
      if (!backupResult.success) {
        return {
          success: false,
          errors: [`No se pudo crear backup de seguridad: ${backupResult.error}`]
        }
      }
      safetyBackupId = backupResult.backupId

      // PASO 6: Limpiar datos existentes
      try {
        await this.clearAllData()
      } catch (clearError) {
        // Si falla la limpieza, restaurar desde backup de seguridad
        await this._restoreFromSafetyBackup(safetyBackupId)
        return {
          success: false,
          errors: [`Error al limpiar datos: ${clearError.message}. Se restauró el backup de seguridad.`]
        }
      }

      // PASO 7: Importar datos del snapshot
      const importSuccess = await this.importAll(data)
      if (!importSuccess) {
        // Si falla la importación, restaurar desde backup de seguridad
        await this._restoreFromSafetyBackup(safetyBackupId)
        return {
          success: false,
          errors: ['Error al importar datos del snapshot. Se restauró el backup de seguridad.']
        }
      }

      // PASO 8: Validar que la restauración fue exitosa
      const restorationValidation = await this._validateRestoration(data)
      if (!restorationValidation.valid) {
        // Si la validación falla, restaurar desde backup de seguridad
        await this._restoreFromSafetyBackup(safetyBackupId)
        return {
          success: false,
          errors: [
            'La restauración no pasó la validación:',
            ...restorationValidation.errors
          ]
        }
      }

      // PASO 9: Éxito - limpiar backup de seguridad (opcional, puedes mantenerlo)
      // localStorage.removeItem(`gestor_gastos_safety_backup_${safetyBackupId}`)

      return {
        success: true,
        backupId: safetyBackupId,
        counts: restorationValidation.counts
      }
    } catch (error) {
      // Si ocurre cualquier error inesperado, restaurar desde backup
      if (safetyBackupId) {
        try {
          await this._restoreFromSafetyBackup(safetyBackupId)
        } catch (restoreError) {
          console.error('Error crítico: no se pudo restaurar desde backup de seguridad', restoreError)
        }
      }

      return {
        success: false,
        errors: [`Error inesperado durante la restauración: ${error.message}`]
      }
    }
  }

  async clearAllData() {
    // ⚠️ CUIDADO: Esto elimina todos los datos visibles para el usuario (RLS)
    const tablesWithUuidId = ['expenses', 'supermarket_purchases', 'cuts', 'budgets']
    for (const table of tablesWithUuidId) {
      await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    }
    // config puede no usar uuid `id`; borrar filas con key definida
    await supabase.from('config').delete().neq('key', '')
    return true
  }

  async recoverExpenseCategories() {
    // Implementar si es necesario
    return true
  }
}

export default SupabaseDatabase
