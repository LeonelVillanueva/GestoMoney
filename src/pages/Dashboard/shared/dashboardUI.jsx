import React from 'react'

export const DASH_FONT = 'IBM Plex Sans, system-ui, sans-serif'

function categoryHue (name) {
  const s = name || 'Otros'
  let h = 0
  for (let i = 0; i < s.length; i += 1) h = (h + s.charCodeAt(i) * 17) % 360
  return h
}

export function CategoryBadge ({ name, className = '' }) {
  const h = categoryHue(name)
  const abbr = (name || '?').slice(0, 2).toUpperCase()
  return (
    <span
      className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white shadow-inner ${className}`}
      style={{ background: `hsl(${h} 45% 38%)` }}
    >
      {abbr}
    </span>
  )
}

export const I = {
  plus: (cls) => (
    <svg className={cls} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden>
      <path strokeLinecap='round' d='M12 5v14M5 12h14' />
    </svg>
  ),
  panel: (cls) => (
    <svg className={cls} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' aria-hidden>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M3.75 6.75h16.5M3.75 12h16.5M12 12v8.25m-8.25-2.25h6'
      />
    </svg>
  ),
  cal: (cls) => (
    <svg className={cls} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' aria-hidden>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25'
      />
    </svg>
  ),
  book: (cls) => (
    <svg className={cls} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' aria-hidden>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M12 6.042A8.967 8.967 0 006.75 4.5c-1.036 0-1.875.84-1.875 1.875v9.75c0 1.035.84 1.875 1.875 1.875 1.5 0 2.86-.5 3.9-1.5M12 6.042A8.967 8.967 0 0117.25 4.5c1.035 0 1.875.84 1.875 1.875v9.75c0 1.035-.84 1.875-1.875 1.875-1.5 0-2.86-.5-3.9-1.5'
      />
    </svg>
  ),
  chart: (cls) => (
    <svg className={cls} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' aria-hidden>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M3 13.125C3 12.504 3.504 12 4.125 12h1.5c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 16.875V13.125zM9.75 8.625C9.75 8.004 10.254 7.5 10.875 7.5h1.5c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-1.5a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125C16.5 3.504 17.004 3 17.625 3h1.5c.621 0 1.125.504 1.125 1.125V16.5c0 .621-.504 1.125-1.125 1.125h-1.5a1.125 1.125 0 01-1.125-1.125V4.125z'
      />
    </svg>
  ),
  coin: (cls) => (
    <svg className={cls} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' aria-hidden>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M12 6v12M9.75 9.75A3 3 0 0112 7.5a3 3 0 013.75.75M9.75 14.25A3 3 0 0012 16.5a3 3 0 003.75-.75'
      />
    </svg>
  ),
  list: (cls) => (
    <svg className={cls} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' aria-hidden>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M8.25 6.75h12M8.25 12h12M8.25 17.25h12M3.75 6.75h.01v.01H3.75V6.75zm.375 0a.375.375 0 10-.75 0 .375.375 0 00.75 0zM3.75 12h.01v.01H3.75V12zm.375 0a.375.375 0 10-.75 0 .375.375 0 00.75 0zM3.75 17.25h.01v.01H3.75v-.01zm.375 0a.375.375 0 10-.75 0 .375.375 0 00.75 0z'
      />
    </svg>
  ),
  trend: (cls) => (
    <svg className={cls} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' aria-hidden>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M2.25 18L9 11.25l3.75 3.75L21.75 4.5M2.25 4.5h3.75V8.25'
      />
    </svg>
  ),
  alert: (cls) => (
    <svg className={cls} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' aria-hidden>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M12 9v3.75m-8.25 3.75h16.5a.75.75 0 00.53-1.28l-8.25-8.25a.75.75 0 00-1.06 0l-8.25 8.25A.75.75 0 003.75 16.5zM12 15.75h.01'
      />
    </svg>
  ),
  check: (cls) => (
    <svg className={cls} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' aria-hidden>
      <path strokeLinecap='round' strokeLinejoin='round' d='M9 12.75L11.25 15 15 9.75' />
    </svg>
  ),
  calc: (cls) => (
    <svg className={cls} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' aria-hidden>
      <rect x='3' y='3' width='18' height='18' rx='2' />
      <path
        strokeLinecap='round'
        d='M7.5 8.25h1.5M12 8.25h.008v.008H12V8.25zM7.5 12h.008M12 12h.008M7.5 16.5H12'
      />
    </svg>
  )
}

export const surfaceApp =
  'pointer-events-none [background:radial-gradient(85%_45%_at_50%_-5%,rgba(37,99,235,0.12),transparent_50%)]'

export const surfacePanel =
  'rounded-3xl border border-zinc-800/50 bg-zinc-950/30 p-4 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-5 md:p-6'

export const dsCard =
  'rounded-2xl border border-zinc-800/80 bg-zinc-900/55 p-4 shadow-lg shadow-black/20 backdrop-blur-sm md:p-5'

export const dsCardMuted =
  'rounded-2xl border border-zinc-800/50 bg-zinc-900/35 p-4 shadow-md shadow-black/10 backdrop-blur-sm md:p-5'

export const dsCardEmphasis =
  'rounded-2xl border border-zinc-700/50 bg-zinc-900/75 p-4 shadow-lg shadow-black/25 ring-1 ring-zinc-700/40 backdrop-blur-sm md:p-5'

export function getPeriodShellClass (active, accent) {
  return `relative cursor-pointer overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 md:p-5 ${
    active
      ? `border-zinc-600 ${accent} shadow-[0_0_0_1px_rgba(59,130,246,0.2)]`
      : 'border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700'
  }`
}
