// Sistema de base de datos principal
import SupabaseDatabase from './supabaseDatabase.js';
import mutationQueue from '../utils/services/mutationQueue.js';

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
  mutationQueue.init();
  mutationQueue.setExecutor(async (operation, args) => {
    const liveDb = await initDatabase();
    if (typeof liveDb[operation] !== 'function') {
      throw new Error(`Operación no soportada en cola: ${operation}`);
    }
    return liveDb[operation](...(args || []));
  });
  return db;
};

const executeMutation = async (operation, args = [], options = {}) => {
  const { queueWhenOffline = true, fallbackValue = true } = options;

  const runMutation = async (op, opArgs) => {
    const db = await initDatabase();
    if (typeof db[op] !== 'function') {
      throw new Error(`Operación no soportada en cola: ${op}`);
    }
    return db[op](...(opArgs || []));
  };

  if (queueWhenOffline && typeof navigator !== 'undefined' && !navigator.onLine) {
    mutationQueue.enqueue({ operation, args });
    return { queued: true, fallbackValue };
  }

  try {
    const result = await runMutation(operation, args);
    mutationQueue.processQueue(runMutation);
    return result;
  } catch (error) {
    const isNetworkError = /network|fetch|timeout|offline|failed to fetch|connection/i.test(error?.message || '');
    if (queueWhenOffline && isNetworkError) {
      mutationQueue.enqueue({ operation, args });
      return { queued: true, fallbackValue };
    }
    throw error;
  }
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
    return await executeMutation('createExpense', [expenseData], { fallbackValue: null });
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
    return await executeMutation('updateExpense', [id, expenseData], { fallbackValue: true });
  },
  
  async deleteExpense(id) {
    return await executeMutation('deleteExpense', [id], { fallbackValue: true });
  },
  
  // Métodos para categorías
  async getCategories() {
    const db = await initDatabase();
    return await db.getCategories();
  },
  
  async createCategory(categoryData) {
    return await executeMutation('createCategory', [categoryData], { queueWhenOffline: false, fallbackValue: null });
  },

  async updateCategory(categoryId, updates) {
    return await executeMutation('updateCategory', [categoryId, updates], { fallbackValue: true });
  },

  async deleteCategory(categoryId) {
    return await executeMutation('deleteCategory', [categoryId], { fallbackValue: true });
  },
  
  // Métodos para compras en supermercados
  async createSupermarketPurchase(purchaseData) {
    return await executeMutation('createSupermarketPurchase', [purchaseData], { fallbackValue: null });
  },
  
  async getSupermarketPurchases(filters = {}) {
    const db = await initDatabase();
    return await db.getSupermarketPurchases(filters);
  },
  
  async updateSupermarketPurchase(id, data) {
    return await executeMutation('updateSupermarketPurchase', [id, data], { fallbackValue: true });
  },
  
  async deleteSupermarketPurchase(id) {
    return await executeMutation('deleteSupermarketPurchase', [id], { fallbackValue: true });
  },
  
  // Métodos para cortes
  async createCut(cutData) {
    return await executeMutation('createCut', [cutData], { fallbackValue: null });
  },
  
  async getCuts(filters = {}) {
    const db = await initDatabase();
    return await db.getCuts(filters);
  },
  
  async updateCut(id, data) {
    return await executeMutation('updateCut', [id, data], { fallbackValue: true });
  },
  
  async deleteCut(id) {
    return await executeMutation('deleteCut', [id], { fallbackValue: true });
  },
  
  // Métodos para configuración
  async getConfig(key) {
    const db = await initDatabase();
    return await db.getConfig(key);
  },
  
  async setConfig(key, value, description = '', options = {}) {
    return await executeMutation('setConfig', [key, value, description, options], { fallbackValue: true });
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
    return await executeMutation('createBudget', [budgetData], { fallbackValue: null });
  },
  
  async getBudgets(month) {
    const db = await initDatabase();
    return await db.getBudgets(month);
  },
  
  async updateBudget(budgetId, updates) {
    return await executeMutation('updateBudget', [budgetId, updates], { fallbackValue: true });
  },
  
  async deleteBudget(budgetId) {
    return await executeMutation('deleteBudget', [budgetId], { fallbackValue: true });
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
  },

  getMutationQueueStatus() {
    mutationQueue.init();
    return mutationQueue.getStatus();
  },

  subscribeMutationQueue(listener) {
    mutationQueue.init();
    return mutationQueue.subscribe(listener);
  },

  flushMutationQueue() {
    mutationQueue.init();
    return mutationQueue.processQueue(async (operation, args) => {
      const db = await initDatabase();
      return db[operation](...(args || []));
    });
  }
};

export default database;