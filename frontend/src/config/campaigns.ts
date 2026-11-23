import { getAddress, type Address } from 'viem'

/** One portfolio campaign: copy plus the deployment the chain reads come from. */
export type CampaignProfile = {
  id: string
  title: string
  description: string
  address: Address
  /** First block scanned for this vault's Deposit events. */
  deployBlock: bigint
}

/**
 * The three Sepolia deployments used for the portfolio demo.
 * Status is never stored here; each page reads it from the contract.
 */
export const portfolioCampaigns: readonly CampaignProfile[] = [
  {
    id: 'film-night',
    title: 'Park film night',
    description:
      'One outdoor screening in the park. The film license and the screen rental are a single bill, and the night is booked only if that bill is met.',
    address: getAddress('0xAAFf7959ed82C106Da2505aECD818d8f87eb53EB'),
    deployBlock: 12_198_077n,
  },
  {
    id: 'mural',
    title: 'Neighborhood mural',
    description:
      'A painter hired for a fixed fee to paint a wall the block already has permission to use. The work starts only when that fee is covered.',
    address: getAddress('0x045d0927523ea1BFA7a355f64EDBa3089502e42d'),
    deployBlock: 12_198_057n,
  },
  {
    id: 'masterclass',
    title: 'Public music masterclass',
    description:
      'One afternoon with a professional musician in a rented rehearsal room. The fee and the room are a single bill, so the class is held only if that cost is covered.',
    address: getAddress('0x07cd1Aa1213f60e667909DE97a5CF0990fB4c37A'),
    deployBlock: 12_198_030n,
  },
]

export function findCampaign(id: string): CampaignProfile | undefined {
  return portfolioCampaigns.find((campaign) => campaign.id === id)
}
