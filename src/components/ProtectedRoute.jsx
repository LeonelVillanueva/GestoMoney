import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import Login from './Login'
import PostLoginTransition from './PostLoginTransition'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isChecking, postLoginTransition, completePostLoginTransition } = useAuth()

  if (isChecking) {
    return (
      <div
        className="fixed inset-0 z-20 flex h-full w-full items-center justify-center bg-zinc-950"
        style={{ minHeight: '100vh', minWidth: '100vw' }}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
          <p className="text-sm font-medium text-zinc-400">Verificando sesión…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  if (postLoginTransition) {
    return <PostLoginTransition onComplete={completePostLoginTransition} />
  }

  return <>{children}</>
}

export default ProtectedRoute

