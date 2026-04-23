import React from 'react'

const KIND_STYLES = {
  loading: {
    icon: '⏳',
    titleColor: 'text-zinc-200',
    messageColor: 'text-zinc-400',
    border: 'border-blue-500/25',
    background: 'bg-blue-500/5'
  },
  empty: {
    icon: '📭',
    titleColor: 'text-zinc-200',
    messageColor: 'text-zinc-400',
    border: 'border-zinc-700/80',
    background: 'bg-zinc-900/40'
  },
  error: {
    icon: '⚠️',
    titleColor: 'text-rose-200',
    messageColor: 'text-rose-300/90',
    border: 'border-rose-500/30',
    background: 'bg-rose-500/8'
  }
}

export default function AsyncStatePanel({
  kind = 'loading',
  title,
  message,
  actionLabel,
  onAction
}) {
  const styles = KIND_STYLES[kind] || KIND_STYLES.loading

  return (
    <div className={`rounded-xl border p-5 text-center ${styles.border} ${styles.background}`}>
      {kind === 'loading' ? (
        <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />
      ) : (
        <div className="mb-3 text-3xl" aria-hidden>{styles.icon}</div>
      )}
      <h4 className={`text-sm font-semibold ${styles.titleColor}`}>{title}</h4>
      <p className={`mt-1 text-xs ${styles.messageColor}`}>{message}</p>
      {onAction && actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-zinc-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
