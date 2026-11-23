import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { readCampaign, type CampaignReading } from '../chain/reads.ts'
import { chain, pollIntervalMs, publicClient } from '../config/app.ts'

function refetchWhileItCanChange(query: { state: { data?: CampaignReading } }): number | false {
  const snapshot = query.state.data?.snapshot
  if (!snapshot) return false
  if (snapshot.isOpen) return pollIntervalMs
  // Closed with the goal met: the only change left is the organizer's withdrawal.
  if (snapshot.totalDeposits >= snapshot.goal && !snapshot.ownerWithdrawn) return 30_000
  // Failed or withdrawn: nothing in the snapshot can change any more.
  return false
}

/** Shared with the catalog, which groups campaigns before rendering a card. */
export function campaignQueryOptions(vault: Address) {
  return {
    queryKey: ['campaign', chain.id, vault] as const,
    queryFn: () => readCampaign(publicClient, vault),
    refetchInterval: refetchWhileItCanChange,
  }
}

/** Reads the campaign state and keeps it fresh for as long as it can still change. */
export function useCampaign(vault: Address) {
  return useQuery(campaignQueryOptions(vault))
}
