import { getAddress, type Address } from 'viem'

export type BlockRange = { fromBlock: bigint; toBlock: bigint }

/** Splits an inclusive block range into consecutive chunks of at most `chunkSize` blocks. */
export function blockRanges(fromBlock: bigint, toBlock: bigint, chunkSize: bigint): BlockRange[] {
  if (chunkSize <= 0n) throw new Error('chunkSize must be greater than zero')
  const ranges: BlockRange[] = []
  for (let start = fromBlock; start <= toBlock; start += chunkSize) {
    const end = start + chunkSize - 1n
    ranges.push({ fromBlock: start, toBlock: end < toBlock ? end : toBlock })
  }
  return ranges
}

/**
 * Last block that can contain a Deposit event.
 *
 * Deposits revert once `block.timestamp >= endTime`, so nothing after the
 * deadline needs scanning. On a chain with a fixed minimum block time, at most
 * `(endTime - deployTimestamp) / blockTime` blocks fit inside the campaign
 * window, which caps the scan no matter how long ago the campaign ended.
 * Without a known block time (local Anvil) the scan runs to the latest block.
 */
export function depositScanEnd(params: {
  latestBlock: bigint
  deployBlock: bigint
  deployTimestamp: bigint
  endTime: bigint
  blockTimeSeconds: bigint | undefined
}): bigint {
  const { latestBlock, deployBlock, deployTimestamp, endTime, blockTimeSeconds } = params
  if (blockTimeSeconds === undefined || blockTimeSeconds <= 0n) return latestBlock
  const window = endTime > deployTimestamp ? endTime - deployTimestamp : 0n
  const lastPossible = deployBlock + window / blockTimeSeconds + 1n
  return lastPossible < latestBlock ? lastPossible : latestBlock
}

export type DepositEvent = { donor: Address; amount: bigint }

export type Donor = {
  address: Address
  /** Sum of every deposit this address made during the campaign. */
  amount: bigint
  deposits: number
}

/** Totals deposits per address, largest contributor first. */
export function aggregateDonors(events: readonly DepositEvent[]): Donor[] {
  const byAddress = new Map<Address, Donor>()
  for (const event of events) {
    const address = getAddress(event.donor)
    const existing = byAddress.get(address)
    if (existing) {
      existing.amount += event.amount
      existing.deposits += 1
    } else {
      byAddress.set(address, { address, amount: event.amount, deposits: 1 })
    }
  }
  return [...byAddress.values()].sort((a, b) => {
    if (a.amount !== b.amount) return a.amount > b.amount ? -1 : 1
    return a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1
  })
}
