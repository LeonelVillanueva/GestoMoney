const QUEUE_KEY = 'gestor_gastos_mutation_queue_v1'
const STATUS_EVENT = 'mutationQueueStatusChanged'
const MIN_RETRY_MS = 1500
const MAX_RETRY_MS = 60000

const NETWORK_ERROR_PATTERN = /network|fetch|timeout|failed to fetch|offline|connection/i

class MutationQueueService {
  constructor() {
    this.queue = []
    this.processing = false
    this.timerId = null
    this.initialized = false
    this.executor = null
  }

  setExecutor(executor) {
    this.executor = executor
  }

  init() {
    if (this.initialized || typeof window === 'undefined') return
    this.initialized = true
    this.queue = this._loadQueue()

    window.addEventListener('online', () => {
      this.processQueue()
    })

    this._emitStatus()
    this.processQueue()
  }

  getStatus() {
    const pending = this.queue.length
    return {
      pending,
      isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
      processing: this.processing
    }
  }

  subscribe(listener) {
    if (typeof window === 'undefined') return () => {}
    const handler = (event) => listener(event.detail)
    window.addEventListener(STATUS_EVENT, handler)
    listener(this.getStatus())
    return () => window.removeEventListener(STATUS_EVENT, handler)
  }

  enqueue(item) {
    this.queue.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      operation: item.operation,
      args: item.args,
      attempts: 0,
      nextAttemptAt: Date.now()
    })
    this._persistQueue()
    this._emitStatus()
    this.processQueue()
  }

  async processQueue(executor) {
    const activeExecutor = executor || this.executor
    if (this.processing || this.queue.length === 0) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    if (!activeExecutor) return
    this.processing = true
    this._emitStatus()

    try {
      const now = Date.now()
      const survivors = []

      for (const item of this.queue) {
        if (item.nextAttemptAt > now) {
          survivors.push(item)
          continue
        }

        try {
          await activeExecutor(item.operation, item.args)
        } catch (error) {
          if (this._isTransientNetworkError(error)) {
            const attempts = item.attempts + 1
            const delay = Math.min(MAX_RETRY_MS, MIN_RETRY_MS * (2 ** attempts))
            survivors.push({
              ...item,
              attempts,
              nextAttemptAt: Date.now() + delay
            })
            continue
          }

          // Error no recuperable: descartamos para evitar loop infinito
        }
      }

      this.queue = survivors
      this._persistQueue()
      this._emitStatus()

      if (this.queue.length > 0) {
        const nextIn = Math.max(1000, this.queue[0].nextAttemptAt - Date.now())
        clearTimeout(this.timerId)
        this.timerId = setTimeout(() => this.processQueue(activeExecutor), nextIn)
      }
    } finally {
      this.processing = false
      this._emitStatus()
    }
  }

  _isTransientNetworkError(error) {
    const message = error?.message || String(error || '')
    return NETWORK_ERROR_PATTERN.test(message)
  }

  _emitStatus() {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent(STATUS_EVENT, { detail: this.getStatus() }))
  }

  _loadQueue() {
    try {
      const raw = localStorage.getItem(QUEUE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch (error) {
      return []
    }
  }

  _persistQueue() {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue))
    } catch (error) {
      // noop
    }
  }
}

const mutationQueue = new MutationQueueService()
export default mutationQueue
