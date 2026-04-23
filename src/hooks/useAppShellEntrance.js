import { useLayoutEffect, useEffect, useRef, useState } from 'react'

/**
 * Fase de entrada del shell principal tras post-login.
 * 'idle' — sin animación; 'enter' — animación en curso; 'settled' — terminó.
 */
export function useAppShellEntrance (entranceTick) {
  const [phase, setPhase] = useState('idle')
  const lastTick = useRef(-1)

  useLayoutEffect(() => {
    if (entranceTick <= 0) return
    if (entranceTick === lastTick.current) return
    lastTick.current = entranceTick
    setPhase('enter')
  }, [entranceTick])

  useEffect(() => {
    if (phase !== 'enter') return
    const t = setTimeout(() => setPhase('settled'), 980)
    return () => clearTimeout(t)
  }, [phase])

  return phase
}
