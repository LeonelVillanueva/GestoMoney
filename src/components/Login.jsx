import React, { useState, useRef, useEffect, useId } from 'react'
import { useAuth } from '../contexts/AuthContext'
import notifications from '../utils/services/notifications'
import logger from '../utils/logger'

const IBM_PLEX = "IBM Plex Sans, system-ui, sans-serif"

function IconWallet({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.004v4.5a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 16.504v-9a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.254V12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12h.008v.008H16.5V12zM3 9.754h10.5a1.5 1.5 0 010 3H3v-3z" />
    </svg>
  )
}

function IconMail({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" d="M2.25 6.75h19.5M2.25 6.75v10.5a1.5 1.5 0 001.5 1.5h16.5a1.5 1.5 0 001.5-1.5V6.75M2.25 6.75L12 13.5l9.75-6.75" />
    </svg>
  )
}

function IconLock({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-1.5 0h12a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75v-7.5a.75.75 0 01.75-.75z" />
    </svg>
  )
}

function IconEye({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function IconEyeOff({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65a3 3 0 00-2.2-.95 3.001 3.001 0 00-1.1.2"
      />
    </svg>
  )
}

function ParticlesField({ active }) {
  const ref = useRef(null)
  const frame = useRef(0)

  useEffect(() => {
    if (!active) return
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let points = []

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      w = parent.clientWidth
      h = parent.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.max(20, Math.floor((w * h) / 12000))
      points = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        v: 0.15 + Math.random() * 0.4,
        o: 0.1 + Math.random() * 0.25
      }))
    }
    resize()
    const onResize = () => resize()
    window.addEventListener('resize', onResize)

    const step = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of points) {
        p.y -= p.v
        if (p.y < 0) {
          p.x = Math.random() * w
          p.y = h + Math.random() * 30
        }
        ctx.fillStyle = `rgba(250, 250, 250, ${p.o})`
        ctx.fillRect(p.x, p.y, 0.6, 2.2)
      }
      frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(frame.current)
    }
  }, [active])

  if (!active) return null
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full opacity-50 mix-blend-screen" aria-hidden />
}

function MiniInsightBars() {
  const heights = [42, 68, 55, 82, 64, 90, 48]
  return (
    <div className="mt-6 flex h-24 items-end justify-between gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-2">
      {heights.map((pct, i) => (
        <div
          key={i}
          className="login-bar flex-1 origin-bottom rounded-t-sm bg-gradient-to-t from-blue-600/20 to-blue-500/60"
          style={{
            height: `${pct}%`,
            animation: `loginBarIn 0.55s ease-out ${i * 0.04}s both`
          }}
        />
      ))}
      <style>{`
        @keyframes loginBarIn {
          from { opacity: 0; transform: scaleY(0.2); }
          to { opacity: 1; transform: scaleY(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .login-bar { animation: none !important; opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  )
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const fn = () => setReduced(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return reduced
}

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const emailId = useId()
  const passId = useId()
  const { login } = useAuth()
  const reducedMotion = usePrefersReducedMotion()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!email.trim()) {
        setError('Ingresa tu email')
        setLoading(false)
        return
      }
      if (!password.trim()) {
        setError('Ingresa tu contraseña')
        setLoading(false)
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        setError('Introduce un email válido')
        setLoading(false)
        return
      }

      const result = await login(email.trim(), password)
      if (result.success) {
        notifications.showSync('Sesión iniciada correctamente', 'success')
        setEmail('')
        setPassword('')
      } else {
        setError(result.error || 'Error al iniciar sesión')
        logger.warn('Intento de login fallido')
      }
    } catch (err) {
      logger.error('Error en login:', err)
      setError('Error al iniciar sesión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 min-h-screen min-w-full overflow-x-hidden bg-zinc-950 text-zinc-50"
      style={{ fontFamily: IBM_PLEX }}
    >
      <style>{`
        .login-grid-line-h,.login-grid-line-v{position:absolute;background:#27272a;will-change:transform,opacity;pointer-events:none;opacity:0.65}
        .login-grid-line-h{left:0;right:0;height:1px;transform:scaleX(0);transform-origin:50% 50%;animation:loginDrawX 0.85s cubic-bezier(0.22,0.61,0.36,1) forwards}
        .login-grid-line-v{top:0;bottom:0;width:1px;transform:scaleY(0);transform-origin:50% 0%;animation:loginDrawY 0.9s cubic-bezier(0.22,0.61,0.36,1) forwards}
        .login-grid-line-h:nth-child(1){top:18%;animation-delay:0.1s}
        .login-grid-line-h:nth-child(2){top:50%;animation-delay:0.2s}
        .login-grid-line-h:nth-child(3){top:82%;animation-delay:0.3s}
        .login-grid-line-v:nth-child(4){left:20%;animation-delay:0.38s}
        .login-grid-line-v:nth-child(5){left:50%;animation-delay:0.5s}
        .login-grid-line-v:nth-child(6){left:80%;animation-delay:0.62s}
        @keyframes loginDrawX{0%{transform:scaleX(0);opacity:0}55%{opacity:0.9}100%{transform:scaleX(1);opacity:0.55}}
        @keyframes loginDrawY{0%{transform:scaleY(0);opacity:0}55%{opacity:0.9}100%{transform:scaleY(1);opacity:0.55}}
        @keyframes loginCardIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .login-card-anim{animation:loginCardIn 0.75s cubic-bezier(0.22,0.61,0.36,1) 0.25s both}
        @media (prefers-reduced-motion: reduce) {
          .login-grid-line-h,.login-grid-line-v{animation:none !important;opacity:0.35;transform:none !important}
          .login-card-anim{animation:none;opacity:1;transform:none}
        }
      `}</style>

      <div
        className="pointer-events-none absolute inset-0 [background:radial-gradient(75%_55%_at_20%_25%,rgba(37,99,235,0.14),transparent_55%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="login-grid-line-h" />
        <div className="login-grid-line-h" />
        <div className="login-grid-line-h" />
        <div className="login-grid-line-v" />
        <div className="login-grid-line-v" />
        <div className="login-grid-line-v" />
      </div>
      <ParticlesField active={!reducedMotion} />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col lg:h-screen lg:max-h-screen lg:flex-row">
        {/* Marca y propuesta de valor */}
        <aside className="relative flex flex-1 flex-col justify-center border-b border-zinc-800/80 px-6 py-10 lg:border-b-0 lg:border-r lg:py-16 lg:pl-10 lg:pr-8">
          <div className="mx-auto w-full max-w-md lg:mx-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs font-medium tracking-wide text-zinc-400">
              <IconWallet className="h-4 w-4 text-blue-500" />
              <span>Finanzas personales</span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl">
              Tu dinero,
              <span className="text-blue-500"> con intención</span>
            </h1>
            <p className="mt-4 text-base font-normal leading-relaxed text-zinc-400">
              Gestor de gastos: registra movimientos, entiende a dónde va tu presupuesto y visualiza tendencias en un
              solo lugar, con datos privados bajo tu control.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-zinc-500">
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" aria-hidden />
                Categoría y búsqueda de gastos en segundos
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" aria-hidden />
                Gráficos para comparar periodos y detectar picos
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" aria-hidden />
                Conexión segura (sesión cifrada en el servidor)
              </li>
            </ul>
            <div className="mt-4 hidden sm:block">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-600">Vista previa</p>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2.5">
                  <p className="text-[10px] text-zinc-500">Mes</p>
                  <p className="text-lg font-semibold tabular-nums text-zinc-200">$ 2,4k</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2.5">
                  <p className="text-[10px] text-zinc-500">Ahorro</p>
                  <p className="text-lg font-semibold tabular-nums text-emerald-400/90">+12%</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2.5">
                  <p className="text-[10px] text-zinc-500">Top</p>
                  <p className="text-lg font-semibold text-zinc-200">Casa</p>
                </div>
              </div>
              <MiniInsightBars />
            </div>
          </div>
        </aside>

        {/* Formulario */}
        <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-8 sm:px-8 lg:py-12">
          <div
            className="login-card-anim w-full max-w-[400px] rounded-2xl border border-zinc-800/90 bg-zinc-900/70 p-6 shadow-2xl shadow-black/50 backdrop-blur-md supports-[backdrop-filter]:bg-zinc-900/60 sm:p-8"
            role="region"
            aria-labelledby="login-heading"
          >
            <div className="mb-8 sm:hidden">
              <div className="mb-1 flex items-center justify-center gap-2 text-zinc-400">
                <IconWallet className="h-5 w-5 text-blue-500" />
                <span className="text-xs font-medium tracking-wide">Gestor de gastos</span>
              </div>
            </div>

            <h2 id="login-heading" className="text-2xl font-semibold text-white">
              Entrar al panel
            </h2>
            <p className="mt-1.5 text-sm text-zinc-400">Usa el correo y la contraseña de tu cuenta.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor={emailId} className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Correo
                </label>
                <div className="relative">
                  <IconMail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    id={emailId}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError('')
                    }}
                    className={`w-full rounded-xl border bg-zinc-950 py-3.5 pl-11 pr-4 text-sm text-zinc-100 shadow-inner outline-none transition-colors duration-200 placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-600/50 ${
                      error ? 'border-red-500/80' : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                    placeholder="tu@email.com"
                    disabled={loading}
                    autoFocus
                    autoComplete="email"
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                </div>
              </div>

              <div>
                <label htmlFor={passId} className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Contraseña
                </label>
                <div className="relative">
                  <IconLock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id={passId}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                    }}
                    className={`w-full rounded-xl border bg-zinc-950 py-3.5 pl-11 pr-12 text-sm text-zinc-100 shadow-inner outline-none transition-colors duration-200 placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-600/50 ${
                      error ? 'border-red-500/80' : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                    placeholder="••••••••"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-2.5 text-zinc-500 transition-colors duration-200 hover:bg-zinc-800 hover:text-zinc-200"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                  </button>
                </div>
                {error && (
                  <p id="login-error" className="mt-2 text-sm text-red-400" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-90"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Comprobando
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
