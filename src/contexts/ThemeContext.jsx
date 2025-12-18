import React, { createContext, useContext, useState, useEffect } from 'react'
import settingsManager from '../utils/services/settings'

const ThemeContext = createContext(null)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Cargar preferencia guardada o detectar preferencia del sistema
    const saved = settingsManager.get('darkMode', null)
    if (saved !== null) {
      return saved === true || saved === 'true'
    }
    // Detectar preferencia del sistema
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  // Aplicar clase dark al documento
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    // Guardar preferencia
    settingsManager.set('darkMode', isDark)
  }, [isDark])

  // Escuchar cambios en preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      // Solo cambiar si no hay preferencia guardada
      const saved = settingsManager.get('darkMode', null)
      if (saved === null) {
        setIsDark(e.matches)
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = () => {
    setIsDark(prev => !prev)
  }

  const setTheme = (dark) => {
    setIsDark(dark)
  }

  const value = {
    isDark,
    toggleTheme,
    setTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeContext
