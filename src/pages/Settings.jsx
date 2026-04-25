import React, { useState, useEffect, useCallback } from 'react'
import settingsManager from '../utils/services/settings'
import DataTab from './settings/DataTab'
import CategoriesTab from './settings/CategoriesTab'
import CutsTab from './settings/CutsTab'
import SupermarketsTab from './settings/SupermarketsTab'
import GeneralTab from './settings/GeneralTab'
import NotificationsTab from './settings/NotificationsTab'
import InterfaceTab from './settings/InterfaceTab'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import notifications from '../utils/services/notifications'
import database from '../database/index.js'
import useCategories from '../hooks/useCategories'
import useCuts from '../hooks/useCuts'
import useSupermarkets from '../hooks/useSupermarkets'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general')
  const [isMobileView, setIsMobileView] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false
  )
  
  // Estado para el modal de confirmación de eliminación
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    itemId: null,
    itemType: null, // 'category', 'cut', 'supermarket', 'all'
    itemName: '',
    isDangerous: false
  })

  // Estado para el modal de confirmación de edición
  const [editModal, setEditModal] = useState({
    isOpen: false,
    itemId: null,
    itemType: null, // 'category', 'cut', 'supermarket'
    itemName: ''
  })
  
  const [settings, setSettings] = useState({
    // Configuración General
    exchangeRate: 26.18,
    defaultCurrency: 'LPS',
    defaultCategory: 'Otros',
    autoSave: true,
    expenseBreakdownYearScope: 'current', // 'current' o 'all'
    
    // Configuración de Notificaciones
    notifications: true,
    notificationSound: true,
    reminderFrequency: 'daily',
    notificationDuration: 4000,
    maxNotifications: 6,
    
    // Configuración de Datos
    autoBackup: true,
    backupFrequency: 'weekly',
    dataRetention: '1year',
    
    // Configuración de Interfaz
    itemsPerPage: 25,
    showCurrencySymbol: true,
    dateFormat: 'dd/mm/yyyy',
    numberFormat: 'comma',
    
    // Configuración de Cortes
    defaultCutTypes: ['Corte Barba', 'Corte Pelo', 'Corte Priv'],
    
    // Configuración de Supermercados
    defaultSupermarkets: ['La Colonia', 'Walmart']
  })

  // Hooks: categorías, cortes, supermercados
  const {
    categories,
    newCategory,
    setNewCategory,
    editingCategory,
    setEditingCategory,
    loadCategories,
    addCategory: handleAddCategory,
    deleteCategory: handleDeleteCategory,
    updateCategory: handleUpdateCategory,
  } = useCategories(activeTab === 'categories')

  const {
    cuts,
    newCutType,
    setNewCutType,
    editingCutType,
    setEditingCutType,
    loadCuts,
    addCutType: handleAddCutType,
    deleteCutType: handleDeleteCutType,
    updateCutType: handleUpdateCutType,
  } = useCuts(activeTab === 'cuts')

  const {
    supermarkets,
    newSupermarket,
    setNewSupermarket,
    editingSupermarket,
    setEditingSupermarket,
    loadSupermarkets,
    addSupermarket: handleAddSupermarket,
    deleteSupermarket: handleDeleteSupermarket,
    updateSupermarket: handleUpdateSupermarket,
  } = useSupermarkets(activeTab === 'supermarkets')

  // Snapshots: manejados dentro de DataTab

  // Tabs disponibles
  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'notifications', label: 'Notificaciones', icon: '🔔' },
    { id: 'data', label: 'Datos', icon: '💾' },
    { id: 'interface', label: 'Interfaz', icon: '🎨' },
    { id: 'categories', label: 'Categorías', icon: '🏷️' },
    { id: 'cuts', label: 'Cortes', icon: '💇' },
    { id: 'supermarkets', label: 'Supermercados', icon: '🛒' }
  ]

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const mediaQuery = window.matchMedia('(max-width: 1023px)')
    const onChange = (event) => setIsMobileView(event.matches)
    setIsMobileView(mediaQuery.matches)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', onChange)
      return () => mediaQuery.removeEventListener('change', onChange)
    }
    mediaQuery.addListener(onChange)
    return () => mediaQuery.removeListener(onChange)
  }, [])

  // Cargas gestionadas por hooks (eliminar funciones locales duplicadas)

  // Snapshots: gestionados en DataTab

  const loadSettings = async () => {
    try {
      const dbConfig = await database.getAllConfig()
      
      // Obtener tasa actual desde la API (con fallback a BD)
      const exchangeApiService = await import('../utils/services/exchangeApi.js')
      const currentRate = await exchangeApiService.default.getExchangeRate()
      
      const savedSettings = {
        exchangeRate: currentRate || (dbConfig.tasa_cambio_usd ? parseFloat(dbConfig.tasa_cambio_usd) : 26.18),
        defaultCurrency: dbConfig.moneda_por_defecto || 'LPS',
        defaultCategory: dbConfig.categoria_por_defecto || 'Otros',
        autoSave: dbConfig.guardado_automatico !== 'false',
        expenseBreakdownYearScope: dbConfig.alcance_desglose_gasto || 'current', // 'current' o 'all'
        
        notifications: dbConfig.notificaciones !== 'false',
        notificationSound: dbConfig.sonido_notificaciones !== 'false',
        reminderFrequency: dbConfig.frecuencia_recordatorios || 'daily',
        notificationDuration: (() => {
          const n = parseInt(dbConfig.duracion_notificaciones, 10)
          return n > 0 && [2000, 4000, 6000, 8000].includes(n) ? n : 4000
        })(),
        maxNotifications: (() => {
          const n = parseInt(dbConfig.max_notificaciones_simultaneas, 10)
          return n >= 1 && n <= 6 ? n : 6
        })(),
        
        autoBackup: dbConfig.respaldo_automatico !== 'false',
        backupFrequency: dbConfig.frecuencia_respaldo || 'weekly',
        dataRetention: dbConfig.retencion_datos || '1year',
        
        itemsPerPage: parseInt(dbConfig.elementos_por_pagina) || 25,
        showCurrencySymbol: dbConfig.mostrar_simbolo_moneda !== 'false',
        dateFormat: dbConfig.formato_fecha || 'dd/mm/yyyy',
        numberFormat: dbConfig.formato_numeros || 'comma',
        
        defaultCutTypes: JSON.parse(dbConfig.tipos_corte_por_defecto || '["Corte Barba", "Corte Pelo", "Corte Priv"]'),
        defaultSupermarkets: JSON.parse(dbConfig.supermercados_por_defecto || '["La Colonia", "Walmart"]')
      }

      notifications.updateSettings({
        enabled: savedSettings.notifications,
        sound: savedSettings.notificationSound,
        duration: savedSettings.notificationDuration,
        maxNotifications: savedSettings.maxNotifications
      })

      setSettings(savedSettings)
    } catch (error) {
      console.error('Error loading settings:', error)
      notifications.showSync('Error al cargar configuración', 'error')
    }
  }

  // (eliminadas funciones locales duplicadas loadCategories/loadCuts/loadSupermarkets)

  // snapshots: manejados por useSnapshots

  const handleSettingChange = async (key, value) => {
    const safeValue = value !== undefined && value !== null ? value : settings[key]
    
    setSettings(prev => ({
      ...prev,
      [key]: safeValue
    }))
    
    try {
      const dbKeyMap = {
        exchangeRate: 'tasa_cambio_usd',
        defaultCurrency: 'moneda_por_defecto',
        defaultCategory: 'categoria_por_defecto',
        autoSave: 'guardado_automatico',
        expenseBreakdownYearScope: 'alcance_desglose_gasto',
        notifications: 'notificaciones',
        notificationSound: 'sonido_notificaciones',
        reminderFrequency: 'frecuencia_recordatorios',
        notificationDuration: 'duracion_notificaciones',
        maxNotifications: 'max_notificaciones_simultaneas',
        autoBackup: 'respaldo_automatico',
        backupFrequency: 'frecuencia_respaldo',
        dataRetention: 'retencion_datos',
        itemsPerPage: 'elementos_por_pagina',
        showCurrencySymbol: 'mostrar_simbolo_moneda',
        dateFormat: 'formato_fecha',
        numberFormat: 'formato_numeros',
        defaultCutTypes: 'tipos_corte_por_defecto',
        defaultSupermarkets: 'supermercados_por_defecto'
      }
      
      const dbKey = dbKeyMap[key]
      if (dbKey) {
        const valueToSave = Array.isArray(safeValue) ? JSON.stringify(safeValue) : String(safeValue)
        await database.setConfig(dbKey, valueToSave)
      }
      
      settingsManager.set(key, safeValue)
      
      // Actualizar currency converter si cambió la tasa de cambio
      // Nota: La tasa ahora se actualiza automáticamente desde la API
      // Este código se mantiene por compatibilidad pero normalmente no se ejecutará
      if (key === 'exchangeRate') {
        const currencyConverter = await import('../utils/services/currency.js')
        currencyConverter.default.setExchangeRate('USD', 'LPS', safeValue)
      }
      
      // Actualizar configuraciones de notificaciones
      if (['notifications', 'notificationSound', 'notificationDuration', 'maxNotifications'].includes(key)) {
        const notificationKeyMap = {
          notifications: 'enabled',
          notificationSound: 'sound',
          notificationDuration: 'duration',
          maxNotifications: 'maxNotifications'
        }
        
        const notificationKey = notificationKeyMap[key]
        if (notificationKey) {
          await notifications.updateSettings({
            [notificationKey]: safeValue
          })
        }
      }
      
      notifications.showSync(`${getSettingLabel(key)} actualizado`, 'success', 1500)
    } catch (error) {
      console.error('Error saving setting:', error)
      notifications.showSync('Error al guardar configuración', 'error')
    }
  }

  const getSettingLabel = (key) => {
    const labels = {
      exchangeRate: 'Tasa de cambio',
      defaultCurrency: 'Moneda por defecto',
      defaultCategory: 'Categoría por defecto',
      autoSave: 'Guardado automático',
      expenseBreakdownYearScope: 'Alcance del desglose de gastos',
      notifications: 'Notificaciones',
      notificationSound: 'Sonido de notificaciones',
      notificationDuration: 'Duración de notificaciones',
      maxNotifications: 'Máximo de notificaciones',
      reminderFrequency: 'Frecuencia de recordatorios',
      autoBackup: 'Respaldo automático',
      backupFrequency: 'Frecuencia de respaldo',
      dataRetention: 'Retención de datos',
      itemsPerPage: 'Elementos por página',
      showCurrencySymbol: 'Mostrar símbolo de moneda',
      dateFormat: 'Formato de fecha',
      numberFormat: 'Formato de números',
      defaultCutTypes: 'Tipos de corte por defecto',
      defaultSupermarkets: 'Supermercados por defecto'
    }
    return labels[key] || key
  }

  // Función para abrir el modal de confirmación de eliminación
  const openDeleteModal = useCallback((itemId, itemType, itemName, isDangerous = false) => {
    setDeleteModal({
      isOpen: true,
      itemId,
      itemType,
      itemName,
      isDangerous
    })
  }, [])

  // Función para cerrar el modal
  const closeDeleteModal = useCallback(() => {
    setDeleteModal({
      isOpen: false,
      itemId: null,
      itemType: null,
      itemName: '',
      isDangerous: false
    })
  }, [])

  // Función para confirmar la eliminación (llamada después de verificar el PIN)
  const confirmDelete = useCallback(async () => {
    const { itemId, itemType } = deleteModal
    
    try {
      switch (itemType) {
        case 'category':
          await handleDeleteCategory(itemId, true) // true = skipConfirm
          break
        case 'cut':
          await handleDeleteCutType(itemId, true)
          break
        case 'supermarket':
          await handleDeleteSupermarket(itemId, true)
          break
        default:
          break
      }
    } catch (error) {
      console.error('Error en confirmDelete:', error)
      notifications.showSync('Error al eliminar', 'error')
    }
    
    closeDeleteModal()
  }, [deleteModal, handleDeleteCategory, handleDeleteCutType, handleDeleteSupermarket, closeDeleteModal])

  // Wrappers para abrir el modal desde los tabs
  const requestDeleteCategory = useCallback((categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    const categoryName = category?.name || 'Categoría'
    openDeleteModal(categoryId, 'category', categoryName)
  }, [categories, openDeleteModal])

  const requestDeleteCutType = useCallback((cutType) => {
    openDeleteModal(cutType, 'cut', cutType)
  }, [openDeleteModal])

  const requestDeleteSupermarket = useCallback((supermarket) => {
    openDeleteModal(supermarket, 'supermarket', supermarket)
  }, [openDeleteModal])

  // Función para abrir el modal de confirmación de edición
  const openEditModal = useCallback((itemId, itemType, itemName) => {
    setEditModal({
      isOpen: true,
      itemId,
      itemType,
      itemName
    })
  }, [])

  // Función para cerrar el modal de edición
  const closeEditModal = useCallback(() => {
    setEditModal({
      isOpen: false,
      itemId: null,
      itemType: null,
      itemName: ''
    })
  }, [])

  // Función para confirmar la edición (llamada después de verificar el PIN)
  const confirmEdit = useCallback(() => {
    const { itemId, itemType } = editModal
    
    switch (itemType) {
      case 'category':
        setEditingCategory(editingCategory === itemId ? null : itemId)
        break
      case 'cut':
        setEditingCutType(editingCutType === itemId ? null : itemId)
        break
      case 'supermarket':
        setEditingSupermarket(editingSupermarket === itemId ? null : itemId)
        break
      default:
        break
    }
    
    closeEditModal()
  }, [editModal, editingCategory, editingCutType, editingSupermarket, setEditingCategory, setEditingCutType, setEditingSupermarket, closeEditModal])

  // Wrappers para abrir el modal de edición desde los tabs
  const requestEditCategory = useCallback((categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    const categoryName = category?.name || 'Categoría'
    openEditModal(categoryId, 'category', categoryName)
  }, [categories, openEditModal])

  const requestEditCutType = useCallback((cutType) => {
    openEditModal(cutType, 'cut', cutType)
  }, [openEditModal])

  const requestEditSupermarket = useCallback((supermarket) => {
    openEditModal(supermarket, 'supermarket', supermarket)
  }, [openEditModal])

  const renderGeneralTab = () => (
    <GeneralTab settings={settings} onSettingChange={handleSettingChange} />
  )

  const renderNotificationsTab = () => (
    <NotificationsTab settings={settings} onSettingChange={handleSettingChange} />
  )

  const renderDataTab = () => (
    <DataTab
      settings={settings}
      onSettingChange={handleSettingChange}
      active={activeTab === 'data'}
    />
  )

  const renderInterfaceTab = () => (
    <InterfaceTab settings={settings} onSettingChange={handleSettingChange} />
  )

  // Lógica de categorías/cortes/supermercados manejada por hooks

  // Constantes para categorías
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', 
    '#ff9ff3', '#54a0ff', '#5f27cd', '#a55eea', '#3498db',
    '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'
  ]

  const icons = ['💰', '🍽️', '🚌', '🎮', '🎁', '⚡', '🏥', '📚', '💻', '📦', '🏠', '👕', '🚗', '✈️', '🎬']

  const renderCategoriesTab = () => (
    <CategoriesTab
      categories={categories}
      newCategory={newCategory}
      setNewCategory={setNewCategory}
      editingCategory={editingCategory}
      setEditingCategory={setEditingCategory}
      onAddCategory={handleAddCategory}
      onDeleteCategory={requestDeleteCategory}
      onUpdateCategory={handleUpdateCategory}
      onRequestEdit={requestEditCategory}
      settings={settings}
      onSettingChange={handleSettingChange}
      colors={colors}
      icons={icons}
    />
  )

  const renderCutsTab = () => (
    <CutsTab
      cuts={cuts}
      newCutType={newCutType}
      setNewCutType={setNewCutType}
      editingCutType={editingCutType}
      setEditingCutType={setEditingCutType}
      onAddCutType={handleAddCutType}
      onDeleteCutType={requestDeleteCutType}
      onUpdateCutType={handleUpdateCutType}
      onRequestEdit={requestEditCutType}
      settings={settings}
    />
  )

  const renderSupermarketsTab = () => (
    <SupermarketsTab
      settings={settings}
      newSupermarket={newSupermarket}
      setNewSupermarket={setNewSupermarket}
      editingSupermarket={editingSupermarket}
      setEditingSupermarket={setEditingSupermarket}
      onAddSupermarket={handleAddSupermarket}
      onDeleteSupermarket={requestDeleteSupermarket}
      onUpdateSupermarket={handleUpdateSupermarket}
      onRequestEdit={requestEditSupermarket}
    />
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralTab()
      case 'notifications': return renderNotificationsTab()
      case 'data': return renderDataTab()
      case 'interface': return renderInterfaceTab()
      case 'categories': return renderCategoriesTab()
      case 'cuts': return renderCutsTab()
      case 'supermarkets': return renderSupermarketsTab()
      default: return renderGeneralTab()
    }
  }

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) || tabs[0]

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-fade-in">
      {/* Header Compacto */}
      <div className={`glass-card rounded-xl ${isMobileView ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className={`${isMobileView ? 'text-xl' : 'text-2xl'} font-bold text-zinc-100 dark:text-slate-100`}>
              ⚙️ Configuración
            </h2>
            {isMobileView && (
              <p className="mt-1 text-xs text-zinc-400">
                {activeTabMeta.icon} {activeTabMeta.label}
              </p>
            )}
          </div>
        </div>
      </div>

      {isMobileView ? (
        <div className="space-y-3">
          <div className="glass-card rounded-xl p-3">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Sección
            </label>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.icon} {tab.label}
                </option>
              ))}
            </select>
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {tab.icon}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-3">
            {renderTabContent()}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Tabs Navigation Compacto */}
          <div className="lg:col-span-3">
            <div className="glass-card rounded-xl p-3">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-zinc-400 dark:text-gray-400 hover:bg-zinc-800/60 dark:hover:bg-slate-700 hover:text-zinc-100 dark:hover:text-gray-200'
                    }`}
                  >
                    <span className="text-base">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="lg:col-span-9">
            <div className="glass-card rounded-xl p-4">
              {renderTabContent()}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title={deleteModal.isDangerous ? '⚠️ Eliminar TODOS los datos' : '¿Eliminar este elemento?'}
        message={deleteModal.isDangerous 
          ? 'Esta acción eliminará permanentemente todos tus datos. Esta acción NO se puede deshacer.'
          : 'Esta acción no se puede deshacer.'
        }
        itemName={deleteModal.itemName}
        isDangerous={deleteModal.isDangerous}
      />

      {/* Modal de confirmación de edición */}
      <DeleteConfirmModal
        isOpen={editModal.isOpen}
        onClose={closeEditModal}
        onConfirm={confirmEdit}
        title="¿Editar este elemento?"
        message="Ingresa tu PIN para continuar con la edición."
        itemName={editModal.itemName}
        actionType="edit"
      />
    </div>
  )
}

export default Settings