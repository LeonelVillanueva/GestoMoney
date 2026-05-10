import React from 'react'

const Notification = ({ message, type = 'info', onClose }) => {
  const getTypeShapeAndStyles = () => {
    const base =
      'w-full max-w-sm border text-zinc-100 shadow-lg shadow-black/30 backdrop-blur-sm transition-shadow duration-300'
    switch (type) {
      case 'success':
        return {
          boxClass: `${base} rounded-3xl border-emerald-500/35 bg-zinc-900/70 ring-1 ring-inset ring-emerald-500/20`,
          accent: 'from-emerald-500/25 to-transparent'
        }
      case 'error':
        return {
          boxClass: `${base} rounded-xl border-red-500/40 bg-zinc-900/70 ring-1 ring-inset ring-red-500/25 [border-radius:0.9rem]`,
          accent: 'from-red-500/30 to-transparent'
        }
      case 'warning':
        return {
          boxClass: `${base} rounded-2xl border-amber-500/40 bg-zinc-900/70 ring-1 ring-inset ring-amber-500/20 [border-top-left-radius:1.4rem] [border-bottom-right-radius:1.4rem] [border-top-right-radius:0.7rem] [border-bottom-left-radius:0.7rem]`,
          accent: 'from-amber-500/25 to-transparent'
        }
      default:
        return {
          boxClass: `${base} rounded-2xl border-sky-500/30 bg-zinc-900/65 ring-1 ring-inset ring-sky-500/15`,
          accent: 'from-sky-500/20 to-transparent'
        }
    }
  }

  const { boxClass, accent } = getTypeShapeAndStyles()

  const dot = 'inline-block h-2 w-2 shrink-0 rounded-full'
  const getIconEl = () => {
    switch (type) {
      case 'success':
        return <span className={`${dot} bg-emerald-400`} aria-hidden />
      case 'error':
        return <span className={`${dot} bg-red-400`} aria-hidden />
      case 'warning':
        return <span className={`${dot} bg-amber-400`} aria-hidden />
      default:
        return <span className={`${dot} bg-sky-400`} aria-hidden />
    }
  }

  return (
    <div
      className={boxClass}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div
        className={`pointer-events-none absolute left-2 right-2 top-1.5 h-1 rounded-full bg-gradient-to-r ${accent} opacity-90`}
        aria-hidden
      />
      <div className="flex items-center gap-3 p-3.5 pt-3.5">
        <span className="flex shrink-0 items-center pt-0.5">{getIconEl()}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-zinc-100">{message}</p>
        </div>
        <button
          type="button"
          onClick={() => onClose?.()}
          className="shrink-0 rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800/80 hover:text-zinc-200"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default Notification
