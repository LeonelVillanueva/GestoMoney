import React from 'react'
import { DASHBOARD_LAYOUTS } from './shared/useDashboardLayout'
import { I } from './shared/dashboardUI'

const OPTIONS = [
  { id: DASHBOARD_LAYOUTS.HERO, label: 'Salud', sub: 'Hero', icon: (c) => I.check(c) },
  { id: DASHBOARD_LAYOUTS.BENTO, label: 'Bento', sub: 'Cuadrícula', icon: (c) => I.panel(c) },
  { id: DASHBOARD_LAYOUTS.OPERATIONS, label: 'Ops', sub: 'Operaciones', icon: (c) => I.list(c) }
]

export default function DashboardViewSwitcher ({ value, onChange, className = '' }) {
  return (
    <div
      className={`inline-flex rounded-xl border border-zinc-800/90 bg-zinc-950/50 p-1 shadow-inner ${className}`}
      role='group'
      aria-label='Cambiar diseño del panel'
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            type='button'
            onClick={() => onChange(opt.id)}
            className={`flex min-w-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left transition-colors sm:gap-2 sm:px-3 ${
              active
                ? 'bg-zinc-800 text-white ring-1 ring-blue-500/40'
                : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
            }`}
          >
            <span className={active ? 'text-blue-400' : 'text-zinc-500'}>
              {opt.icon('h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0')}
            </span>
            <span className='min-w-0'>
              <span className='block text-[11px] font-semibold leading-tight sm:text-xs'>{opt.label}</span>
              <span className='hidden text-[9px] text-zinc-500 sm:block'>{opt.sub}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
