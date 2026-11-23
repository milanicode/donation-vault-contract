export const THEME_STORAGE_KEY = 'donation-vault-theme'

export type Theme = 'light' | 'dark'

/** `system` means no stored choice: follow the visitor's color-scheme preference. */
export type ThemeChoice = Theme | 'system'

export const THEME_COLORS: Record<Theme, string> = {
  light: '#f7f5f0',
  dark: '#101412',
}

export function parseThemeChoice(value: string | null | undefined): ThemeChoice {
  return value === 'light' || value === 'dark' ? value : 'system'
}

export function resolveTheme(choice: ThemeChoice, systemIsDark: boolean): Theme {
  if (choice === 'light' || choice === 'dark') return choice
  return systemIsDark ? 'dark' : 'light'
}

export function toggleTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark'
}

/** Applies a resolved theme to the document. Safe to call before React renders. */
export function applyDomTheme(theme: Theme): void {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
  const color = THEME_COLORS[theme]
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.setAttribute('content', color)
    meta.removeAttribute('media')
  }
}
