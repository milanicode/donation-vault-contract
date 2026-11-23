import { describe, expect, it } from 'vitest'
import { formatCountdown, formatEth, parseEthAmount, shortAddress } from './format.ts'

const ETH = 10n ** 18n

describe('formatEth', () => {
  it('drops trailing zeros', () => {
    expect(formatEth(0n)).toBe('0')
    expect(formatEth(ETH)).toBe('1')
    expect(formatEth(ETH + ETH / 2n)).toBe('1.5')
  })

  it('truncates instead of rounding up', () => {
    expect(formatEth(1_999_999_999_999_999_999n)).toBe('1.9999')
    expect(formatEth(123_456_789_000_000_000n, 2)).toBe('0.12')
  })

  it('never shows a non-zero amount as zero', () => {
    expect(formatEth(1n)).toBe('<0.0001')
    expect(formatEth(1n, 2)).toBe('<0.01')
  })
})

describe('shortAddress', () => {
  it('keeps the first and last characters', () => {
    expect(shortAddress('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')).toBe('0xf39F…2266')
  })
})

describe('formatCountdown', () => {
  it('shows the two most significant units', () => {
    expect(formatCountdown(3n * 86_400n + 4n * 3_600n + 59n)).toBe('3d 4h')
    expect(formatCountdown(4n * 3_600n + 12n * 60n + 5n)).toBe('4h 12m')
    expect(formatCountdown(12n * 60n + 30n)).toBe('12m 30s')
    expect(formatCountdown(30n)).toBe('30s')
  })

  it('clamps at zero', () => {
    expect(formatCountdown(0n)).toBe('0s')
    expect(formatCountdown(-5n)).toBe('0s')
  })
})

describe('parseEthAmount', () => {
  it('parses decimal amounts', () => {
    expect(parseEthAmount('0.05')).toEqual({ ok: true, wei: 5n * 10n ** 16n })
    expect(parseEthAmount(' 1 ')).toEqual({ ok: true, wei: ETH })
    expect(parseEthAmount('.5')).toEqual({ ok: true, wei: ETH / 2n })
    expect(parseEthAmount('2.')).toEqual({ ok: true, wei: 2n * ETH })
  })

  it('accepts a comma as the decimal separator', () => {
    expect(parseEthAmount('0,25')).toEqual({ ok: true, wei: ETH / 4n })
  })

  it('accepts the smallest unit', () => {
    expect(parseEthAmount('0.000000000000000001')).toEqual({ ok: true, wei: 1n })
  })

  it('rejects empty, zero, negative and malformed input', () => {
    for (const input of ['', '   ', '0', '0.000', '-1', 'abc', '1e18', '1.2.3', '.', '0x10']) {
      expect(parseEthAmount(input).ok, input).toBe(false)
    }
  })

  it('rejects more than 18 decimals instead of rounding', () => {
    expect(parseEthAmount('0.0000000000000000001').ok).toBe(false)
  })
})
