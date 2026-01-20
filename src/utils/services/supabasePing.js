import { supabase } from '../../database/supabase.js'
import logger from '../logger.js'

/**
 * Servicio para mantener activo el proyecto de Supabase
 * Evita la suspensión automática por inactividad (más de 7 días)
 */
class SupabasePingService {
  constructor() {
    this.intervalId = null
    this.isRunning = false
    // Ping cada 5 días (432000 minutos) para estar seguros antes de los 7 días
    this.intervalMinutes = 5 * 24 * 60 // 5 días en minutos
    // O cada 1 día para mayor seguridad (1440 minutos)
    this.intervalMinutes = 1 * 24 * 60 // 1 día en minutos (más seguro)
  }

  /**
   * Realiza un ping simple a Supabase
   * Usa una consulta ligera a la tabla config que siempre existe
   */
  async ping() {
    try {
      // Hacer una consulta simple y ligera
      const { data, error } = await supabase
        .from('config')
        .select('key')
        .limit(1)
        .maybeSingle()

      // Si hay error pero no es crítico, lo ignoramos
      if (error && error.code !== 'PGRST116') {
        return false
      }

      return true
    } catch (error) {
      logger.error('❌ Error en ping a Supabase:', error)
      return false
    }
  }

  /**
   * Inicia el servicio de ping periódico
   */
  start() {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    
    // Hacer un ping inmediato al iniciar
    this.ping()

    // Configurar ping periódico
    const intervalMs = this.intervalMinutes * 60 * 1000 // Convertir minutos a milisegundos
    
    this.intervalId = setInterval(() => {
      this.ping()
    }, intervalMs)
  }

  /**
   * Detiene el servicio de ping
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      this.isRunning = false
    }
  }

  /**
   * Obtiene el estado del servicio
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.intervalMinutes,
      intervalDays: this.intervalMinutes / (24 * 60)
    }
  }
}

// Exportar instancia única (Singleton)
const supabasePingService = new SupabasePingService()

export default supabasePingService

