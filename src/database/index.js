// Sistema de base de datos principal
import SupabaseDatabase from './supabaseDatabase.js';

// Instancia única de la base de datos
let databaseInstance = null;

// Función para obtener la instancia de la base de datos
const getDatabase = () => {
  if (!databaseInstance) {
    databaseInstance = new SupabaseDatabase();
  }
  return databaseInstance;
};

// Función para inicializar la base de datos
const initDatabase = async () => {
  const db = getDatabase();
  if (!db.initialized) {
    await db.init();
  }
  return db;
};

// Función para cerrar la base de datos
const closeDatabase = () => {
  if (databaseInstance) {
    databaseInstance.close();
    databaseInstance = null;
  }
};

// Exportar la instancia de la base de datos
const database = {
  // Métodos de inicialización
  init: initDatabase,
  close: closeDatabase,
  
  // Métodos para gastos
  async createExpense(expenseData) {
    const db = await initDatabase();
    return await db.createExpense(expenseData);
  },
  
  async getExpenses(filters = {}) {
    const db = await initDatabase();
    return await db.getExpenses(filters);
  },
  
  async getExpenseById(id) {
    const db = await initDatabase();
    return await db.getExpenseById(id);
  },
  
  async updateExpense(id, expenseData) {
    const db = await initDatabase();
    return await db.updateExpense(id, expenseData);
  },
  
  async deleteExpense(id) {
    const db = await initDatabase();
    return await db.deleteExpense(id);
  },
  
  // Métodos para categorías
  async getCategories() {
    const db = await initDatabase();
    return await db.getCategories();
  },
  
  async createCategory(categoryData) {
    const db = await initDatabase();
    return await db.createCategory(categoryData);
  },

  async updateCategory(categoryId, updates) {
    const db = await initDatabase();
    return await db.updateCategory(categoryId, updates);
  },

  async deleteCategory(categoryId) {
    const db = await initDatabase();
    return await db.deleteCategory(categoryId);
  },
  
  // Métodos para compras en supermercados
  async createSupermarketPurchase(purchaseData) {
    const db = await initDatabase();
    return await db.createSupermarketPurchase(purchaseData);
  },
  
  async getSupermarketPurchases(filters = {}) {
    const db = await initDatabase();
    return await db.getSupermarketPurchases(filters);
  },
  
  async updateSupermarketPurchase(id, data) {
    const db = await initDatabase();
    return await db.updateSupermarketPurchase(id, data);
  },
  
  async deleteSupermarketPurchase(id) {
    const db = await initDatabase();
    return await db.deleteSupermarketPurchase(id);
  },
  
  // Métodos para cortes
  async createCut(cutData) {
    const db = await initDatabase();
    return await db.createCut(cutData);
  },
  
  async getCuts(filters = {}) {
    const db = await initDatabase();
    return await db.getCuts(filters);
  },
  
  async updateCut(id, data) {
    const db = await initDatabase();
    return await db.updateCut(id, data);
  },
  
  async deleteCut(id) {
    const db = await initDatabase();
    return await db.deleteCut(id);
  },
  
  // Métodos para configuración
  async getConfig(key) {
    const db = await initDatabase();
    return await db.getConfig(key);
  },
  
  async setConfig(key, value, description = '') {
    const db = await initDatabase();
    return await db.setConfig(key, value, description);
  },
  
  async getAllConfig() {
    const db = await initDatabase();
    return await db.getAllConfig();
  },

  // Backup/export
  async exportAll() {
    const db = await initDatabase();
    return await db.exportAll();
  },

  async importAll(payload) {
    const db = await initDatabase();
    return await db.importAll(payload);
  },

  // Auto-backup snapshots API
  async listSnapshots() {
    const db = await initDatabase();
    return await db.listSnapshots();
  },
  async createSnapshot() {
    const db = await initDatabase();
    return await db.createSnapshot();
  },
  async deleteSnapshot(id) {
    const db = await initDatabase();
    return await db.deleteSnapshot(id);
  },
  async restoreSnapshot(id) {
    const db = await initDatabase();
    return await db.restoreSnapshot(id);
  },
  
  // Métodos de estadísticas
  async getExpenseStats(filters = {}) {
    const db = await initDatabase();
    return await db.getExpenseStats(filters);
  },
  
  async getExpensesByCategory(filters = {}) {
    const db = await initDatabase();
    return await db.getExpensesByCategory(filters);
  },
  
  // Métodos para presupuestos
  async createBudget(budgetData) {
    const db = await initDatabase();
    return await db.createBudget(budgetData);
  },
  
  async getBudgets(month) {
    const db = await initDatabase();
    return await db.getBudgets(month);
  },
  
  async updateBudget(budgetId, updates) {
    const db = await initDatabase();
    return await db.updateBudget(budgetId, updates);
  },
  
  async deleteBudget(budgetId) {
    const db = await initDatabase();
    return await db.deleteBudget(budgetId);
  },
  
  // Limpiar todos los datos
  async clearAllData() {
    const db = await initDatabase();
    return db.clearAllData();
  },
  
  // Recuperar categorías de gastos huérfanos
  async recoverExpenseCategories() {
    const db = await initDatabase();
    return await db.recoverExpenseCategories();
  }
};

export default database;