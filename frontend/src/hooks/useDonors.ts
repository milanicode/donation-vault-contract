import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { fetchDonors, readDeposited } from '../chain/reads.ts'
import { blockTimeSeconds, chain, env, publicClient } from '../config/app.ts'

/**
 * Donor list built from Deposit events.
 *
 * `totalDeposits` is part of the query key, so the events are scanned again
 * only when the on-chain total changes, not on every poll.
 */
export function useDonors(
  vault: Address,
  endTime: bigint,
  totalDeposits: bigint,
  deployBlock: bigint,
) {
  return useQuery({
    queryKey: ['donors', chain.id, vault, totalDeposits.toString()],
    queryFn: async () => {
      const donors = await fetchDonors(publicClient, {
        vault,
        deployBlock,
        endTime,
        chunkSize: env.logsChunkSize,
        blockTimeSeconds,
      })
      const listed = donors.reduce((sum, donor) => sum + donor.amount, 0n)
      // The events must add up to the contract's own total. If they do not,
      // the RPC node is behind or VITE_DEPLOY_BLOCK is after the deployment.
      return { donors, complete: listed === totalDeposits }
    },
    placeholderData: keepPreviousData,
    refetchInterval: (query) => (query.state.data?.complete === false ? 15_000 : false),
  })
}

/**
 * Addresses whose refund has been claimed. Only meaningful for a failed
 * campaign, where `deposited(address)` drops to zero once the refund is paid.
 */
export function useRefundedDonors(vault: Address, addresses: readonly Address[], enabled: boolean) {
  return useQuery({
    queryKey: ['refunded', chain.id, vault, addresses],
    enabled: enabled && addresses.length > 0,
    queryFn: async () => {
      const balances = await readDeposited(publicClient, vault, addresses)
      return new Set(addresses.filter((_, index) => balances[index] === 0n))
    },
    refetchInterval: (query) => {
      const refunded = query.state.data
      return refunded && refunded.size === addresses.length ? false : 30_000
    },
  })
}
