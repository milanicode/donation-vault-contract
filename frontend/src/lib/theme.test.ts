import { describe, expect, it } from 'vitest'
import { parseThemeChoice, resolveTheme, toggleTheme } from './theme.ts'

describe('parseThemeChoice', () => {
  it('keeps an explicit choice', () => {
    expect(parseThemeChoice('light')).toBe('light')
    expect(parseThemeChoice('dark')).toBe('dark')
  })

  it('treats anything else as following the system', () => {
    for (const value of [null, undefined, '', 'system', 'LIGHT', 'auto']) {
      expect(parseThemeChoice(value)).toBe('system')
    }
  })
})

describe('resolveTheme', () => {
  it('honours an explicit choice over the system', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('follows the system when nothing is stored', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
})

describe('toggleTheme', () => {
  it('swaps between the two themes', () => {
    expect(toggleTheme('dark')).toBe('light')
    expect(toggleTheme('light')).toBe('dark')
    expect(toggleTheme(toggleTheme('dark'))).toBe('dark')
  })
})
