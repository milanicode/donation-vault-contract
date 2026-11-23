import { useCallback, useEffect, useState } from 'react'
import {
  THEME_STORAGE_KEY,
  applyDomTheme,
  parseThemeChoice,
  resolveTheme,
  toggleTheme,
  type Theme,
} from '../lib/theme.ts'

function systemIsDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function readChoice() {
  try {
    return parseThemeChoice(localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return 'system' as const
  }
}

/** The active theme. The first visit follows the system; a toggle is remembered. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => resolveTheme(readChoice(), systemIsDark()))

  useEffect(() => {
    applyDomTheme(theme)
  }, [theme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (readChoice() === 'system') setTheme(resolveTheme('system', media.matches))
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback(() => {
    const next = toggleTheme(theme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Private browsing can reject storage. The choice still applies until reload.
    }
    setTheme(next)
  }, [theme])

  return { theme, toggle }
}
