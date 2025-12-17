import React, { useState, useEffect } from 'react'
import settingsManager from '../utils/services/settings'
import DataTab from './settings/DataTab'
import CategoriesTab from './settings/CategoriesTab'
import CutsTab from './settings/CutsTab'
import SupermarketsTab from './settings/SupermarketsTab'
import GeneralTab from './settings/GeneralTab'
import NotificationsTab from './settings/NotificationsTab'
import InterfaceTab from './settings/InterfaceTab'
import DangerTab from './settings/DangerTab'
import notifications from '../utils/services/notifications'
import database from '../database/index.js'
import useCategories from '../hooks/useCategories'
import useCuts from '../hooks/useCuts'
import useSupermarkets from '../hooks/useSupermarkets'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    // Configuración General
    exchangeRate: 26.18,
    defaultCurrency: 'LPS',
    defaultCategory: 'Otros',
    autoSave: true,
    
    // Configuración de Notificaciones
    notifications: true,
    notificationSound: true,
    reminderFrequency: 'daily',
    notificationDuration: 4000,
    maxNotifications: 5,
    
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
    { id: 'supermarkets', label: 'Supermercados', icon: '🛒' },
    { id: 'danger', label: 'Peligro', icon: '⚠️' }
  ]

  useEffect(() => {
    loadSettings()
  }, [])

  // Cargas gestionadas por hooks (eliminar funciones locales duplicadas)

  // Snapshots: gestionados en DataTab

  const loadSettings = async () => {
    try {
      const dbConfig = await database.getAllConfig()
      
      const savedSettings = {
        exchangeRate: dbConfig.tasa_cambio_usd ? parseFloat(dbConfig.tasa_cambio_usd) : 26.18,
        defaultCurrency: dbConfig.moneda_por_defecto || 'LPS',
        defaultCategory: dbConfig.categoria_por_defecto || 'Otros',
        autoSave: dbConfig.guardado_automatico !== 'false',
        
        notifications: dbConfig.notificaciones !== 'false',
        notificationSound: dbConfig.sonido_notificaciones !== 'false',
        reminderFrequency: dbConfig.frecuencia_recordatorios || 'daily',
        
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
        notifications: 'notificaciones',
        notificationSound: 'sonido_notificaciones',
        reminderFrequency: 'frecuencia_recordatorios',
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
        const valueToSave = Array.isArray(safeValue) ? JSON.stringify(safeValue) : safeValue.toString()
        await database.setConfig(dbKey, valueToSave)
      }
      
      settingsManager.set(key, safeValue)
      
      // Actualizar currency converter si cambió la tasa de cambio
      if (key === 'exchangeRate') {
        const currencyConverter = await import('../utils/services/currency.js')
        currencyConverter.default.setExchangeRate('USD', 'LPS', safeValue)
        currencyConverter.default.saveExchangeRates()
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
      notifications: 'Notificaciones',
      notificationSound: 'Sonido de notificaciones',
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

  const handleClearData = async () => {
    const confirmed = window.confirm('⚠️ ¿Estás seguro de que quieres eliminar TODOS los datos?\n\nEsto incluye:\n• Todos los gastos registrados\n• Todas las categorías personalizadas\n• Configuraciones guardadas\n\nEsta acción NO se puede deshacer.')
    
    if (confirmed) {
      const doubleConfirmed = window.confirm('🔥 ÚLTIMA CONFIRMACIÓN 🔥\n\n¿Realmente quieres eliminar TODOS los datos?')
      
      if (doubleConfirmed) {
        try {
          await database.clearAllData()
          notifications.showSync('Todos los datos han sido eliminados', 'warning', 3000)
          setTimeout(() => window.location.reload(), 2000)
        } catch (error) {
          console.error('Error clearing data:', error)
          notifications.showSync('Error al eliminar los datos', 'error')
        }
      }
    }
  }

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
      onDeleteCategory={handleDeleteCategory}
      onUpdateCategory={handleUpdateCategory}
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
      onDeleteCutType={handleDeleteCutType}
      onUpdateCutType={handleUpdateCutType}
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
      onDeleteSupermarket={handleDeleteSupermarket}
      onUpdateSupermarket={handleUpdateSupermarket}
    />
  )

  const renderDangerTab = () => (
    <DangerTab onClearData={handleClearData} />
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
      case 'danger': return renderDangerTab()
      default: return renderGeneralTab()
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-fade-in">
      {/* Header Compacto */}
      <div className="glass-card rounded-xl p-4">
        <h2 className="text-2xl font-bold text-slate-800">⚙️ Configuración</h2>
      </div>

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
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
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
    </div>
  )
}

export default Settings