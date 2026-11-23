import type { Address, Chain, Hash } from 'viem'
import { foundry, sepolia } from 'viem/chains'
import { createConfig, http, injected } from 'wagmi'
import { SEPOLIA_ID, parseEnv } from './env.ts'

export const { env, problems } = parseEnv(import.meta.env)

export const chain: Chain = env.chainId === SEPOLIA_ID ? sepolia : foundry

export const chainLabel = env.chainId === SEPOLIA_ID ? 'Sepolia testnet' : 'Local Anvil'

/**
 * Minimum seconds between blocks, used to bound the Deposit event scan.
 * Sepolia has 12-second slots; Anvil mines on demand, so it has no bound.
 */
export const blockTimeSeconds = env.chainId === SEPOLIA_ID ? 12n : undefined

/** How often the campaign state is re-read while it can still change. */
export const pollIntervalMs = env.chainId === SEPOLIA_ID ? 12_000 : 3_000

export const wagmiConfig = createConfig({
  chains: [chain],
  connectors: [injected()],
  transports: { [chain.id]: http(env.rpcUrl) },
})

/** Read-only client. Works without a wallet, so anyone can view the campaign. */
export const publicClient = wagmiConfig.getClient({ chainId: chain.id })

const explorerBase = chain.blockExplorers?.default.url
export const explorerName = chain.blockExplorers?.default.name

/** Block explorer link, or `undefined` on chains without one (local Anvil). */
export function explorerUrl(kind: 'address', value: Address): string | undefined
export function explorerUrl(kind: 'tx', value: Hash): string | undefined
export function explorerUrl(kind: 'address' | 'tx', value: string): string | undefined {
  return explorerBase ? `${explorerBase}/${kind}/${value}` : undefined
}
