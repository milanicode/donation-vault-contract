import { describe, expect, it } from 'vitest'
import { aggregateDonors, blockRanges, depositScanEnd } from './donors.ts'

const ALICE = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
const BOB = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'

describe('blockRanges', () => {
  it('covers the range with no gaps or overlaps', () => {
    expect(blockRanges(100n, 349n, 100n)).toEqual([
      { fromBlock: 100n, toBlock: 199n },
      { fromBlock: 200n, toBlock: 299n },
      { fromBlock: 300n, toBlock: 349n },
    ])
  })

  it('returns one range when everything fits', () => {
    expect(blockRanges(5n, 9n, 100n)).toEqual([{ fromBlock: 5n, toBlock: 9n }])
    expect(blockRanges(7n, 7n, 1n)).toEqual([{ fromBlock: 7n, toBlock: 7n }])
  })

  it('returns nothing when the range is empty', () => {
    expect(blockRanges(10n, 9n, 100n)).toEqual([])
  })

  it('rejects a chunk size that would never advance', () => {
    expect(() => blockRanges(0n, 10n, 0n)).toThrow()
  })
})

describe('depositScanEnd', () => {
  const base = { deployBlock: 1_000n, deployTimestamp: 50_000n, endTime: 50_000n + 1_200n }

  it('stops at the last block that fits inside the campaign window', () => {
    // 1200 s at 12 s per block is 100 blocks, plus one block of margin.
    expect(depositScanEnd({ ...base, latestBlock: 900_000n, blockTimeSeconds: 12n })).toBe(1_101n)
  })

  it('never goes past the latest block', () => {
    expect(depositScanEnd({ ...base, latestBlock: 1_040n, blockTimeSeconds: 12n })).toBe(1_040n)
  })

  it('scans to the latest block when the block time is unknown', () => {
    expect(depositScanEnd({ ...base, latestBlock: 5_000n, blockTimeSeconds: undefined })).toBe(
      5_000n,
    )
  })

  it('handles a deadline that is not after the deployment timestamp', () => {
    expect(
      depositScanEnd({ ...base, endTime: 10n, latestBlock: 9_000n, blockTimeSeconds: 12n }),
    ).toBe(1_001n)
  })
})

describe('aggregateDonors', () => {
  it('sums repeat deposits per address', () => {
    const donors = aggregateDonors([
      { donor: ALICE, amount: 10n },
      { donor: BOB, amount: 50n },
      { donor: ALICE, amount: 15n },
    ])
    expect(donors).toEqual([
      { address: BOB, amount: 50n, deposits: 1 },
      { address: ALICE, amount: 25n, deposits: 2 },
    ])
  })

  it('treats differently-cased addresses as the same donor', () => {
    const donors = aggregateDonors([
      { donor: ALICE, amount: 1n },
      { donor: ALICE.toLowerCase() as `0x${string}`, amount: 2n },
    ])
    expect(donors).toEqual([{ address: ALICE, amount: 3n, deposits: 2 }])
  })

  it('orders equal amounts deterministically', () => {
    const forward = aggregateDonors([
      { donor: ALICE, amount: 5n },
      { donor: BOB, amount: 5n },
    ])
    const reverse = aggregateDonors([
      { donor: BOB, amount: 5n },
      { donor: ALICE, amount: 5n },
    ])
    expect(forward).toEqual(reverse)
  })

  it('returns an empty list for no events', () => {
    expect(aggregateDonors([])).toEqual([])
  })
})
