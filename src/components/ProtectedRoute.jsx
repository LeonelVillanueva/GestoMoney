import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import Login from './Login'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isChecking } = useAuth()

  if (isChecking) {
    return (
      <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center" style={{ minHeight: '100vh', minWidth: '100vw' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl font-medium">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return <>{children}</>
}

export default ProtectedRoute

