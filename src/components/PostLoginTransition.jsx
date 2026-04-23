import React, { useEffect, useLayoutEffect, useState, useRef, useCallback, useId } from 'react'

const FONT = "IBM Plex Sans, system-ui, sans-serif"

function IconWallet({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12.004v4.5a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.504v-9a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.254V12"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 12h.008v.008H16.5V12zM3 9.754h10.5a1.5 1.5 0 010 3H3v-3z"
      />
    </svg>
  )
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(q.matches)
    const fn = () => setReduced(q.matches)
    q.addEventListener('change', fn)
    return () => q.removeEventListener('change', fn)
  }, [])
  return reduced
}

/**
 * Secuencia visual: login correcto → animación de “gestor de gastos” → panel principal.
 */
export default function PostLoginTransition({ onComplete }) {
  const reduced = usePrefersReducedMotion()
  const [phase, setPhase] = useState(0)
  const [exiting, setExiting] = useState(false)
  const lineRef = useRef(null)
  const timers = useRef([])
  const gradId = `plt-grad-${useId().replace(/:/g, '')}`

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  const finish = useCallback(() => {
    clearTimers()
    onComplete()
  }, [clearTimers, onComplete])

  useEffect(() => {
    if (reduced) {
      const t = setTimeout(finish, 700)
      return () => clearTimeout(t)
    }

    const schedule = (fn, delay) => {
      const id = setTimeout(fn, delay)
      timers.current.push(id)
      return id
    }

    schedule(() => setPhase(1), 200)
    schedule(() => setPhase(2), 1000)
    schedule(() => setPhase(3), 2100)
    schedule(() => {
      setExiting(true)
      schedule(finish, 900)
    }, 3300)

    return () => {
      clearTimers()
    }
  }, [reduced, clearTimers, finish])

  useLayoutEffect(() => {
    if (reduced || phase < 2 || !lineRef.current) return
    const path = lineRef.current
    const len = path.getTotalLength?.() || 200
    path.style.strokeDasharray = `${len} ${len}`
    path.style.strokeDashoffset = String(len)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        path.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(0.32, 0.72, 0, 1)'
        path.style.strokeDashoffset = '0'
      })
    })
  }, [phase, reduced])

  const showBars = phase >= 1
  const showLine = phase >= 2
  const showCopy = phase >= 3
  const categories = ['Vivienda', 'Comida', 'Transporte', 'Ocio']
  const barFractions = [0.32, 0.55, 0.44, 0.72, 0.5, 0.85, 0.38]

  if (reduced) {
    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950"
        style={{ fontFamily: FONT }}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <p className="text-zinc-300">Entrando al panel…</p>
      </div>
    )
  }

  return (
    <div
      className={`fixed inset-0 z-[200] overflow-hidden bg-zinc-950 text-zinc-100 transition-[opacity,transform,filter] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        exiting
          ? 'pointer-events-none opacity-0 [transform:scale(1.02)] [filter:blur(3px)]'
          : 'opacity-100 [transform:scale(1)] [filter:blur(0)]'
      }`}
      style={{ fontFamily: FONT }}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Preparando tu panel de gestión de gastos"
    >
      <style>{`
        @keyframes plt-orb {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 0.4; }
          50% { transform: translate(8%, -6%) scale(1.08); opacity: 0.7; }
        }
        @keyframes plt-float {
          0% { transform: translateY(110vh) rotate(-8deg); opacity: 0; }
          12% { opacity: 0.55; }
          100% { transform: translateY(-20vh) rotate(6deg); opacity: 0; }
        }
        @keyframes plt-wallet {
          0% { transform: scale(0.2) rotate(-12deg); opacity: 0; }
          55% { transform: scale(1.12) rotate(2deg); opacity: 1; }
          75% { transform: scale(0.95) rotate(0deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes plt-shine {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .plt-orb1 { animation: plt-orb 7s ease-in-out infinite; }
        .plt-orb2 { animation: plt-orb 9s ease-in-out infinite reverse; }
        .plt-wallet-anim { animation: plt-wallet 0.9s cubic-bezier(0.34,1.56,0.64,1) both; }
        .plt-title-grad {
          background: linear-gradient(90deg, #a1a1aa, #f4f4f5, #a1a1aa);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: plt-shine 2.2s linear infinite;
        }
      `}</style>

      {/* Fondo: gradientes y “documentos” flotantes (tema contable) */}
      <div
        className="absolute inset-0 [background:radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(37,99,235,0.2),transparent)]"
        aria-hidden
      />
      <div
        className="plt-orb1 absolute -left-1/4 top-0 h-[70vmin] w-[70vmin] rounded-full bg-blue-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="plt-orb2 absolute -right-1/4 bottom-0 h-[60vmin] w-[60vmin] rounded-full bg-violet-600/15 blur-3xl"
        aria-hidden
      />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="absolute h-7 w-12 rounded-sm border border-zinc-600/40 bg-zinc-800/30 shadow-lg"
          style={{
            left: `${10 + (i * 12) % 80}%`,
            animation: `plt-float ${8 + (i % 3)}s linear ${i * 0.35}s infinite`
          }}
          aria-hidden
        />
      ))}

      <div className="relative z-10 flex min-h-full flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Marca + icono */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div
              className="plt-wallet-anim mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/30 bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 text-blue-400 shadow-[0_0_40px_rgba(37,99,235,0.25)]"
            >
              <IconWallet className="h-10 w-10" />
            </div>
            <h2
              className="text-2xl font-semibold tracking-tight text-white sm:text-3xl"
              style={{ fontFamily: FONT }}
            >
              Sincronizando tu{' '}
              <span className="text-blue-400">gestión de gastos</span>
            </h2>
            <p className="mt-2 max-w-sm text-sm text-zinc-500">
              Organizando categorías, tendencias y resúmenes para que veas el panorama completo.
            </p>
          </div>

          {/* Categorías chips */}
          <div
            className={`mb-5 flex flex-wrap justify-center gap-2 transition-all duration-700 ${
              showBars ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {categories.map((c, i) => (
              <span
                key={c}
                className="rounded-full border border-zinc-700/80 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-400"
                style={{
                  transition: `all 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) ${80 + i * 70}ms`,
                  transform: showBars ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.96)',
                  opacity: showBars ? 1 : 0
                }}
              >
                {c}
              </span>
            ))}
          </div>

          {/* Panel: barras + línea de tendencia */}
          <div
            className="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/60 p-4 shadow-2xl backdrop-blur-md"
            style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)' }}
          >
            <div className="mb-1 flex items-end justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Actividad reciente</p>
              <p className="text-[10px] text-zinc-600">Vista resumen</p>
            </div>

            <div className="relative px-0.5 pt-4">
              <div className="flex h-36 min-h-0 items-end justify-between gap-1.5 sm:h-40">
                {barFractions.map((f, i) => (
                  <div
                    key={i}
                    className="flex h-full min-h-0 flex-1 flex-col justify-end rounded-t-sm bg-zinc-800/40"
                  >
                    <div
                      className="w-full origin-bottom rounded-t-sm bg-gradient-to-t from-blue-600/30 to-blue-500/80 transition-transform duration-700 ease-out [will-change:transform]"
                      style={{
                        height: showBars ? `${f * 100}%` : '0%',
                        transform: 'scaleY(1)',
                        transitionDelay: `${120 + i * 60}ms`
                      }}
                    />
                  </div>
                ))}
              </div>
              {showLine && (
                <svg
                  className="pointer-events-none absolute bottom-0 left-2 right-2 h-[88%] w-[calc(100%-16px)] overflow-visible"
                  viewBox="0 0 200 80"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    ref={lineRef}
                    d="M0 60 Q 35 45, 50 52 T 100 40 T 150 28 T 200 20"
                    fill="none"
                    stroke={`url(#${gradId})`}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#60a5fa" />
                      <stop offset="0.5" stopColor="#a78bfa" />
                      <stop offset="1" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </div>
          </div>

          {/* Mensaje final + indicador */}
          <div
            className={`mt-8 text-center transition-all duration-500 ${
              showCopy ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
            }`}
          >
            <p className="plt-title-grad text-lg font-semibold">Tu panel está listo</p>
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-zinc-500">
              <span
                className="inline-block h-2 w-2 rounded-full bg-emerald-400"
                style={{ boxShadow: '0 0 10px #34d399' }}
              />
              Cargando dashboard e historial
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
