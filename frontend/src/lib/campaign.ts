import type { Address } from 'viem'

/** On-chain state of one DonationVault, read in a single batch. */
export type CampaignSnapshot = {
  owner: Address
  goal: bigint
  endTime: bigint
  totalDeposits: bigint
  ownerWithdrawn: boolean
  /** `isOpen()` as the node sees it: true while the latest block is before `endTime`. */
  isOpen: boolean
}

/**
 * - `open`: deposits accepted.
 * - `closing`: the deadline has passed on the visitor's clock but the chain has
 *   not produced a block past it yet, so no action is certain to succeed.
 * - `succeeded`: closed with the goal met; the organizer can withdraw.
 * - `withdrawn`: closed, goal met, and the organizer has withdrawn.
 * - `failed`: closed with the goal missed; donors can claim refunds.
 */
export type CampaignStatus = 'open' | 'closing' | 'succeeded' | 'withdrawn' | 'failed'

export const STATUS_LABEL: Record<CampaignStatus, string> = {
  open: 'Open for donations',
  closing: 'Closing',
  succeeded: 'Goal reached',
  withdrawn: 'Completed',
  failed: 'Goal not reached',
}

/**
 * The chain decides whether the campaign is closed. The local clock is only
 * used to stop offering donations in the last seconds before the chain catches
 * up, when a deposit would most likely revert.
 */
export function deriveStatus(snapshot: CampaignSnapshot, nowSeconds: bigint): CampaignStatus {
  if (snapshot.isOpen) {
    return nowSeconds >= snapshot.endTime ? 'closing' : 'open'
  }
  if (snapshot.totalDeposits < snapshot.goal) return 'failed'
  return snapshot.ownerWithdrawn ? 'withdrawn' : 'succeeded'
}

/**
 * Best estimate of the chain's current time, in seconds.
 *
 * The later of two clocks is used: the last block timestamp advanced by the
 * time since it was read, and the visitor's own clock. The chain clock keeps
 * the countdown right when the visitor's clock is slow or a local Anvil chain
 * has been moved forward in time; the local clock covers the seconds since the
 * last block. Preferring the later value errs towards closing donations early
 * rather than letting a deposit be sent that would revert.
 */
export function estimateChainNow(
  blockTimestamp: bigint,
  fetchedAtMs: number,
  nowMs: number,
): bigint {
  const elapsed = BigInt(Math.max(0, Math.floor((nowMs - fetchedAtMs) / 1000)))
  const fromChain = blockTimestamp + elapsed
  const fromClock = BigInt(Math.floor(nowMs / 1000))
  return fromChain > fromClock ? fromChain : fromClock
}

/** Whole-number percentage of the goal raised, rounded down. Can exceed 100. */
export function fundedPercent(totalDeposits: bigint, goal: bigint): number {
  if (goal === 0n) return 0
  return Number((totalDeposits * 100n) / goal)
}

/** Progress bar fill between 0 and 1. */
export function progressFraction(totalDeposits: bigint, goal: bigint): number {
  if (goal === 0n) return 0
  if (totalDeposits >= goal) return 1
  return Number((totalDeposits * 10_000n) / goal) / 10_000
}

/** A donor's share of everything raised, e.g. `66.7%`. */
export function formatShare(amount: bigint, totalDeposits: bigint): string {
  if (totalDeposits === 0n || amount === 0n) return '0%'
  // Tenths of a percent, rounded half up, using integer math only.
  const tenths = (amount * 2000n + totalDeposits) / (2n * totalDeposits)
  if (tenths === 0n) return '<0.1%'
  const whole = tenths / 10n
  const fraction = tenths % 10n
  return fraction === 0n ? `${whole}%` : `${whole}.${fraction}%`
}
