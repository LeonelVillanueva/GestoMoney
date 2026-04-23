import { useState, useCallback } from 'react'

export const DASHBOARD_LAYOUT_KEY = 'gestorGastos.dashboardLayout'
export const DASHBOARD_LAYOUTS = {
  HERO: 'hero',
  BENTO: 'bento',
  OPERATIONS: 'operations'
}

function readInitialLayout () {
  try {
    const s = localStorage.getItem(DASHBOARD_LAYOUT_KEY)
    if (s === DASHBOARD_LAYOUTS.HERO || s === DASHBOARD_LAYOUTS.BENTO || s === DASHBOARD_LAYOUTS.OPERATIONS) {
      return s
    }
  } catch {
    // ignore
  }
  return DASHBOARD_LAYOUTS.BENTO
}

export function useDashboardLayout () {
  const [layout, setLayoutState] = useState(readInitialLayout)

  const setLayout = useCallback((next) => {
    setLayoutState(next)
    try {
      localStorage.setItem(DASHBOARD_LAYOUT_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  return [layout, setLayout]
}
