import React from 'react'

const toneMap = {
  danger: {
    panel: 'border-rose-500/35',
    icon: 'text-rose-300',
    confirm: 'bg-rose-600 hover:bg-rose-700 text-white'
  },
  warning: {
    panel: 'border-amber-500/35',
    icon: 'text-amber-300',
    confirm: 'bg-amber-600 hover:bg-amber-700 text-white'
  },
  info: {
    panel: 'border-blue-500/35',
    icon: 'text-blue-300',
    confirm: 'bg-blue-600 hover:bg-blue-700 text-white'
  }
}

export default function ConfirmDialog({
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  tone = 'info',
  onConfirm,
  onCancel
}) {
  const toneStyles = toneMap[tone] || toneMap.info

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-xl border ${toneStyles.panel} bg-zinc-900 p-5 shadow-2xl`}>
        <div className="mb-3 flex items-center gap-2">
          <span aria-hidden className={`text-xl ${toneStyles.icon}`}>⚠️</span>
          <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
        </div>
        <p className="whitespace-pre-line text-sm text-zinc-300">{message}</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${toneStyles.confirm}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
