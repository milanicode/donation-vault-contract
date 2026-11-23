import type { Address, Chain, Client, Transport } from 'viem'
import { getBlock, getBlockNumber, getContractEvents, multicall, readContract } from 'viem/actions'
import { donationVaultAbi } from '../abi/donationVault.ts'
import type { CampaignSnapshot } from '../lib/campaign.ts'
import {
  aggregateDonors,
  blockRanges,
  depositScanEnd,
  type DepositEvent,
  type Donor,
} from '../lib/donors.ts'

type ReadClient = Client<Transport, Chain>

const multicall3TimestampAbi = [
  {
    type: 'function',
    name: 'getCurrentBlockTimestamp',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'timestamp', type: 'uint256' }],
  },
] as const

export type CampaignReading = {
  snapshot: CampaignSnapshot
  /** Timestamp of the block the snapshot was read at. */
  blockTimestamp: bigint
  /** Local `Date.now()` when the reading arrived. */
  fetchedAtMs: number
}

export async function readCampaign(client: ReadClient, vault: Address): Promise<CampaignReading> {
  const contract = { address: vault, abi: donationVaultAbi } as const
  const multicall3 = client.chain.contracts?.multicall3?.address

  if (multicall3) {
    // One eth_call, so every value comes from the same block.
    const [owner, goal, endTime, totalDeposits, ownerWithdrawn, isOpen, blockTimestamp] =
      await multicall(client, {
        allowFailure: false,
        contracts: [
          { ...contract, functionName: 'owner' },
          { ...contract, functionName: 'goal' },
          { ...contract, functionName: 'endTime' },
          { ...contract, functionName: 'totalDeposits' },
          { ...contract, functionName: 'ownerWithdrawn' },
          { ...contract, functionName: 'isOpen' },
          {
            address: multicall3,
            abi: multicall3TimestampAbi,
            functionName: 'getCurrentBlockTimestamp',
          },
        ],
      })
    return {
      snapshot: { owner, goal, endTime, totalDeposits, ownerWithdrawn, isOpen },
      blockTimestamp,
      fetchedAtMs: Date.now(),
    }
  }

  // No Multicall3 on a fresh Anvil chain: read each value separately.
  const [block, owner, goal, endTime, totalDeposits, ownerWithdrawn, isOpen] = await Promise.all([
    getBlock(client),
    readContract(client, { ...contract, functionName: 'owner' }),
    readContract(client, { ...contract, functionName: 'goal' }),
    readContract(client, { ...contract, functionName: 'endTime' }),
    readContract(client, { ...contract, functionName: 'totalDeposits' }),
    readContract(client, { ...contract, functionName: 'ownerWithdrawn' }),
    readContract(client, { ...contract, functionName: 'isOpen' }),
  ])
  return {
    snapshot: { owner, goal, endTime, totalDeposits, ownerWithdrawn, isOpen },
    blockTimestamp: block.timestamp,
    fetchedAtMs: Date.now(),
  }
}

/** Builds the donor list from every Deposit event the vault has emitted. */
export async function fetchDonors(
  client: ReadClient,
  params: {
    vault: Address
    deployBlock: bigint
    endTime: bigint
    chunkSize: bigint
    blockTimeSeconds: bigint | undefined
  },
): Promise<Donor[]> {
  const { vault, deployBlock, endTime, chunkSize, blockTimeSeconds } = params

  const latestBlock = await getBlockNumber(client, { cacheTime: 0 })
  let deployTimestamp = 0n
  if (blockTimeSeconds !== undefined) {
    deployTimestamp = (await getBlock(client, { blockNumber: deployBlock })).timestamp
  }
  const scanEnd = depositScanEnd({
    latestBlock,
    deployBlock,
    deployTimestamp,
    endTime,
    blockTimeSeconds,
  })

  const events: DepositEvent[] = []
  // Sequential on purpose: public RPC endpoints rate-limit bursts of eth_getLogs.
  for (const range of blockRanges(deployBlock, scanEnd, chunkSize)) {
    const logs = await getContractEvents(client, {
      address: vault,
      abi: donationVaultAbi,
      eventName: 'Deposit',
      strict: true,
      ...range,
    })
    for (const log of logs) {
      events.push({ donor: log.args.user, amount: log.args.amount })
    }
  }
  return aggregateDonors(events)
}

/** Current `deposited(address)` for each address, in the same order. */
export async function readDeposited(
  client: ReadClient,
  vault: Address,
  addresses: readonly Address[],
): Promise<bigint[]> {
  const calls = addresses.map(
    (address) =>
      ({
        address: vault,
        abi: donationVaultAbi,
        functionName: 'deposited',
        args: [address],
      }) as const,
  )
  if (client.chain.contracts?.multicall3) {
    return multicall(client, { allowFailure: false, contracts: calls, batchSize: 8_192 })
  }
  return Promise.all(calls.map((call) => readContract(client, call)))
}
