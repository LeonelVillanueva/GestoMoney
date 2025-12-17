import { supabase } from './supabase.js'

class SupabaseDatabase {
  constructor() {
    this.initialized = false
  }

  async init() {
    // Verificar conexión
    const { data, error } = await supabase.from('categories').select('count').limit(1)
    if (error && error.code !== 'PGRST116') { // PGRST116 = tabla vacía, es OK
      throw new Error(`Error conectando a Supabase: ${error.message}`)
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
        moneda_original: expenseData.moneda_original || 'LPS'
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
    const { data, error } = await supabase
      .from('config')
      .select('value')
      .eq('key', key)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data?.value || null
  }

  async setConfig(key, value, description = '') {
    const { error } = await supabase
      .from('config')
      .upsert({
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        description
      }, { onConflict: 'key' })

    if (error) throw error
    return true
  }

  async getAllConfig() {
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
    const { data, error } = await supabase
      .from('budgets')
      .upsert({
        category: budgetData.category,
        amount: budgetData.amount,
        month: budgetData.month
      }, { onConflict: 'category,month' })
      .select()
      .single()

    if (error) throw error
    return data.id
  }

  async getBudgets(month) {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('month', month)

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
  // BACKUP/EXPORT (Opcionales)
  // ============================================

  async exportAll() {
    // Implementar si es necesario
    return {}
  }

  async importAll(payload) {
    // Implementar si es necesario
    return true
  }

  async listSnapshots() {
    return []
  }

  async createSnapshot() {
    return null
  }

  async deleteSnapshot(id) {
    return true
  }

  async restoreSnapshot(id) {
    return true
  }

  async clearAllData() {
    // ⚠️ CUIDADO: Esto elimina todos los datos
    const tables = ['expenses', 'supermarket_purchases', 'cuts', 'budgets', 'config']
    for (const table of tables) {
      await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    }
    return true
  }

  async recoverExpenseCategories() {
    // Implementar si es necesario
    return true
  }
}

export default SupabaseDatabase
