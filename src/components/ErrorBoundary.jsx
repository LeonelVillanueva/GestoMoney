import React from 'react'

// Detectar si estamos en modo desarrollo
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Actualiza el state para que el siguiente render muestre la UI de error
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Registrar el error solo en desarrollo o en un servicio de reporte de errores
    if (isDevelopment) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo)
    }
    // En producción, podrías enviar el error a un servicio como Sentry
    // if (!isDevelopment) {
    //   // Enviar a servicio de reporte de errores
    // }
    
    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      // En producción, no mostrar detalles técnicos
      const showDetails = isDevelopment
      
      return (
        <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center p-6" style={{ minHeight: '100vh', minWidth: '100vw' }}>
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Error en la aplicación
              </h1>
              <p className="text-gray-600">
                Ha ocurrido un error inesperado. Por favor, recarga la página.
              </p>
            </div>
            
            {/* Solo mostrar detalles en desarrollo */}
            {showDetails && this.state.error && (
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <p className="text-sm font-mono text-red-600 mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-700 cursor-pointer hover:text-gray-900">
                      Detalles del error (solo en desarrollo)
                    </summary>
                    <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                🔄 Recargar página
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

