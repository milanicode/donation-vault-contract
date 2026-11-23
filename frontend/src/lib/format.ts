import { formatEther, parseEther, type Address } from 'viem'

/**
 * Formats wei as ETH with at most `maxDecimals` decimals. Truncates instead of
 * rounding so a balance is never displayed as more than it is.
 */
export function formatEth(wei: bigint, maxDecimals = 4): string {
  const [whole = '0', fraction = ''] = formatEther(wei).split('.')
  const kept = fraction.slice(0, maxDecimals).replace(/0+$/, '')
  if (wei > 0n && whole === '0' && kept === '') {
    return `<0.${'0'.repeat(Math.max(maxDecimals - 1, 0))}1`
  }
  return kept ? `${whole}.${kept}` : whole
}

export function shortAddress(address: Address): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

/** `3d 4h`, `4h 12m`, `12m 30s` or `30s`: the two most significant units. */
export function formatCountdown(totalSeconds: bigint): string {
  if (totalSeconds <= 0n) return '0s'
  const days = totalSeconds / 86_400n
  const hours = (totalSeconds % 86_400n) / 3_600n
  const minutes = (totalSeconds % 3_600n) / 60n
  const seconds = totalSeconds % 60n
  if (days > 0n) return `${days}d ${hours}h`
  if (hours > 0n) return `${hours}h ${minutes}m`
  if (minutes > 0n) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export function formatDateTime(unixSeconds: bigint, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(Number(unixSeconds) * 1000),
  )
}

export type ParsedAmount = { ok: true; wei: bigint } | { ok: false; error: string }

/** Parses a donation amount typed by a person, e.g. `0.05`. */
export function parseEthAmount(input: string): ParsedAmount {
  const value = input.trim().replace(',', '.')
  if (value === '') return { ok: false, error: 'Enter an amount.' }
  if (!/^(\d+\.?\d*|\.\d+)$/.test(value)) {
    return { ok: false, error: 'Enter a number, for example 0.05.' }
  }
  const decimals = value.split('.')[1] ?? ''
  if (decimals.length > 18) {
    return { ok: false, error: 'ETH has at most 18 decimal places.' }
  }
  const wei = parseEther(value)
  if (wei === 0n) return { ok: false, error: 'Enter an amount greater than zero.' }
  return { ok: true, wei }
}
