import { describe, expect, it } from 'vitest'
import {
  deriveStatus,
  estimateChainNow,
  formatShare,
  fundedPercent,
  progressFraction,
  type CampaignSnapshot,
} from './campaign.ts'

const ETH = 10n ** 18n
const END = 1_000_000n

function snapshot(overrides: Partial<CampaignSnapshot> = {}): CampaignSnapshot {
  return {
    owner: '0x0000000000000000000000000000000000000001',
    goal: 3n * ETH,
    endTime: END,
    totalDeposits: 0n,
    ownerWithdrawn: false,
    isOpen: true,
    ...overrides,
  }
}

describe('deriveStatus', () => {
  it('is open while the chain reports open and the deadline is ahead', () => {
    expect(deriveStatus(snapshot(), END - 1n)).toBe('open')
  })

  it('stays open when the goal is already met before the deadline', () => {
    expect(deriveStatus(snapshot({ totalDeposits: 5n * ETH }), END - 1n)).toBe('open')
  })

  it('is closing when the local clock passes the deadline before the chain does', () => {
    expect(deriveStatus(snapshot(), END)).toBe('closing')
    expect(deriveStatus(snapshot(), END + 30n)).toBe('closing')
  })

  it('trusts the chain over a local clock that is behind', () => {
    const closed = snapshot({ isOpen: false, totalDeposits: ETH })
    expect(deriveStatus(closed, END - 500n)).toBe('failed')
  })

  it('fails when closed below the goal', () => {
    expect(deriveStatus(snapshot({ isOpen: false, totalDeposits: 3n * ETH - 1n }), END)).toBe(
      'failed',
    )
  })

  it('succeeds when closed exactly at the goal', () => {
    expect(deriveStatus(snapshot({ isOpen: false, totalDeposits: 3n * ETH }), END)).toBe(
      'succeeded',
    )
  })

  it('is withdrawn once the organizer has taken the funds', () => {
    const done = snapshot({ isOpen: false, totalDeposits: 4n * ETH, ownerWithdrawn: true })
    expect(deriveStatus(done, END + 10n)).toBe('withdrawn')
  })
})

describe('estimateChainNow', () => {
  it('uses the local clock when the last block is older than it', () => {
    expect(estimateChainNow(1_000n, 5_000_000, 5_000_000)).toBe(5_000n)
  })

  it('uses the chain clock when the chain is ahead of the local clock', () => {
    // Block timestamp 9000 read at local second 5000, three seconds ago.
    expect(estimateChainNow(9_000n, 5_000_000, 5_003_400)).toBe(9_003n)
  })

  it('never moves the chain clock backwards if the local clock jumps back', () => {
    expect(estimateChainNow(9_000n, 5_000_000, 4_000_000)).toBe(9_000n)
  })
})

describe('fundedPercent', () => {
  it('rounds down', () => {
    expect(fundedPercent(2n * ETH, 3n * ETH)).toBe(66)
    expect(fundedPercent(3n * ETH - 1n, 3n * ETH)).toBe(99)
  })

  it('goes past 100 when overfunded', () => {
    expect(fundedPercent(6n * ETH, 3n * ETH)).toBe(200)
  })

  it('is 0 for an empty campaign or a zero goal', () => {
    expect(fundedPercent(0n, 3n * ETH)).toBe(0)
    expect(fundedPercent(ETH, 0n)).toBe(0)
  })
})

describe('progressFraction', () => {
  it('is proportional below the goal', () => {
    expect(progressFraction(ETH, 4n * ETH)).toBe(0.25)
  })

  it('caps at 1', () => {
    expect(progressFraction(3n * ETH, 3n * ETH)).toBe(1)
    expect(progressFraction(9n * ETH, 3n * ETH)).toBe(1)
  })

  it('is 0 for a zero goal', () => {
    expect(progressFraction(ETH, 0n)).toBe(0)
  })
})

describe('formatShare', () => {
  it('formats whole and fractional shares', () => {
    expect(formatShare(ETH, 2n * ETH)).toBe('50%')
    expect(formatShare(2n * ETH, 3n * ETH)).toBe('66.7%')
    expect(formatShare(ETH, 3n * ETH)).toBe('33.3%')
    expect(formatShare(ETH, ETH)).toBe('100%')
  })

  it('marks tiny non-zero shares instead of showing 0', () => {
    expect(formatShare(1n, 10n * ETH)).toBe('<0.1%')
  })

  it('is 0% for no contribution or an empty campaign', () => {
    expect(formatShare(0n, ETH)).toBe('0%')
    expect(formatShare(0n, 0n)).toBe('0%')
  })
})
