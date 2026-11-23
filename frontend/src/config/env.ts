import { getAddress, isAddress, type Address } from 'viem'

export const SEPOLIA_ID = 11155111
export const ANVIL_ID = 31337

export type SupportedChainId = typeof SEPOLIA_ID | typeof ANVIL_ID

export type AppEnv = {
  /**
   * Single-vault address used by the local Anvil preview.
   * `null` when unset. The Sepolia portfolio lists its own contracts.
   */
  vaultAddress: Address | null
  chainId: SupportedChainId
  /** First block scanned for Deposit events. */
  deployBlock: bigint
  rpcUrl: string | undefined
  logsChunkSize: bigint
  title: string
  description: string
  repoUrl: string | undefined
}

const DEFAULT_TITLE = 'All-or-nothing fundraiser'
const DEFAULT_DESCRIPTION =
  'Donations are held by a smart contract until the deadline. If the goal is reached, ' +
  'the organizer can withdraw the funds. If it is not, every donor can claim a full refund.'
const DEFAULT_LOGS_CHUNK_SIZE = 10_000n

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function parseWholeNumber(value: string): bigint | null {
  return /^\d+$/.test(value) ? BigInt(value) : null
}

/**
 * Turns raw `VITE_*` variables into a typed config plus a list of problems a
 * person can act on. It never throws: a misconfigured deployment should render
 * setup instructions, not a blank page.
 */
export function parseEnv(raw: Record<string, string | undefined>): {
  env: AppEnv
  problems: string[]
} {
  const problems: string[] = []

  let chainId: SupportedChainId = SEPOLIA_ID
  const rawChainId = clean(raw.VITE_CHAIN_ID)
  if (rawChainId !== undefined) {
    if (rawChainId === String(SEPOLIA_ID)) chainId = SEPOLIA_ID
    else if (rawChainId === String(ANVIL_ID)) chainId = ANVIL_ID
    else problems.push(`VITE_CHAIN_ID must be ${SEPOLIA_ID} (Sepolia) or ${ANVIL_ID} (Anvil).`)
  }

  let vaultAddress: Address | null = null
  const rawAddress = clean(raw.VITE_VAULT_ADDRESS)
  if (rawAddress !== undefined) {
    if (!isAddress(rawAddress)) {
      problems.push('VITE_VAULT_ADDRESS is not a valid Ethereum address.')
    } else {
      vaultAddress = getAddress(rawAddress)
    }
  }

  let deployBlock = 0n
  const rawDeployBlock = clean(raw.VITE_DEPLOY_BLOCK)
  if (rawDeployBlock !== undefined) {
    const parsed = parseWholeNumber(rawDeployBlock)
    if (parsed === null) problems.push('VITE_DEPLOY_BLOCK must be a whole number.')
    else deployBlock = parsed
  }

  let logsChunkSize = DEFAULT_LOGS_CHUNK_SIZE
  const rawChunk = clean(raw.VITE_LOGS_CHUNK_SIZE)
  if (rawChunk !== undefined) {
    const parsed = parseWholeNumber(rawChunk)
    if (parsed === null || parsed === 0n) {
      problems.push('VITE_LOGS_CHUNK_SIZE must be a whole number greater than zero.')
    } else {
      logsChunkSize = parsed
    }
  }

  const rpcUrl = clean(raw.VITE_RPC_URL)
  if (rpcUrl !== undefined && !/^https?:\/\//i.test(rpcUrl)) {
    problems.push('VITE_RPC_URL must start with http:// or https://.')
  }

  let repoUrl = clean(raw.VITE_REPO_URL)
  if (repoUrl !== undefined && !/^https?:\/\//i.test(repoUrl)) {
    problems.push('VITE_REPO_URL must start with http:// or https://.')
    repoUrl = undefined
  }

  return {
    env: {
      vaultAddress,
      chainId,
      deployBlock,
      rpcUrl,
      logsChunkSize,
      title: clean(raw.VITE_CAMPAIGN_TITLE) ?? DEFAULT_TITLE,
      description: clean(raw.VITE_CAMPAIGN_DESCRIPTION) ?? DEFAULT_DESCRIPTION,
      repoUrl,
    },
    problems,
  }
}
