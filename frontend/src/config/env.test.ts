import { describe, expect, it } from 'vitest'
import { ANVIL_ID, SEPOLIA_ID, parseEnv } from './env.ts'

const ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

describe('parseEnv', () => {
  it('accepts a complete Sepolia configuration', () => {
    const { env, problems } = parseEnv({
      VITE_VAULT_ADDRESS: ADDRESS,
      VITE_CHAIN_ID: '11155111',
      VITE_DEPLOY_BLOCK: '9000000',
    })
    expect(problems).toEqual([])
    expect(env.vaultAddress).toBe(ADDRESS)
    expect(env.chainId).toBe(SEPOLIA_ID)
    expect(env.deployBlock).toBe(9_000_000n)
    expect(env.logsChunkSize).toBe(10_000n)
    expect(env.repoUrl).toBeUndefined()
  })

  it('defaults to Sepolia and does not require a single vault address', () => {
    const { env, problems } = parseEnv({})
    expect(env.chainId).toBe(SEPOLIA_ID)
    expect(env.vaultAddress).toBeNull()
    expect(env.deployBlock).toBe(0n)
    expect(problems).toEqual([])
  })

  it('does not need a deploy block on Anvil', () => {
    const { env, problems } = parseEnv({ VITE_VAULT_ADDRESS: ADDRESS, VITE_CHAIN_ID: '31337' })
    expect(problems).toEqual([])
    expect(env.chainId).toBe(ANVIL_ID)
    expect(env.deployBlock).toBe(0n)
  })

  it('treats a blank address as unset', () => {
    const { env, problems } = parseEnv({ VITE_VAULT_ADDRESS: '  ', VITE_CHAIN_ID: '31337' })
    expect(env.vaultAddress).toBeNull()
    expect(problems).toEqual([])
  })

  it('reports an invalid address', () => {
    const { env, problems } = parseEnv({ VITE_VAULT_ADDRESS: '0x1234', VITE_CHAIN_ID: '31337' })
    expect(env.vaultAddress).toBeNull()
    expect(problems[0]).toMatch(/not a valid Ethereum address/)
  })

  it('normalises a lower-case address to its checksum form', () => {
    const { env } = parseEnv({
      VITE_VAULT_ADDRESS: ADDRESS.toLowerCase(),
      VITE_CHAIN_ID: '31337',
    })
    expect(env.vaultAddress).toBe(ADDRESS)
  })

  it('rejects unsupported chains and malformed numbers', () => {
    const { problems } = parseEnv({
      VITE_VAULT_ADDRESS: ADDRESS,
      VITE_CHAIN_ID: '1',
      VITE_DEPLOY_BLOCK: '12abc',
      VITE_LOGS_CHUNK_SIZE: '0',
    })
    expect(problems).toHaveLength(3)
  })

  it('rejects URLs that are not http(s)', () => {
    const { env, problems } = parseEnv({
      VITE_VAULT_ADDRESS: ADDRESS,
      VITE_CHAIN_ID: '31337',
      VITE_RPC_URL: 'ws://localhost:8545',
      VITE_REPO_URL: 'javascript:alert(1)',
    })
    expect(problems).toHaveLength(2)
    expect(env.repoUrl).toBeUndefined()
  })

  it('uses custom copy when provided', () => {
    const { env } = parseEnv({
      VITE_VAULT_ADDRESS: ADDRESS,
      VITE_CHAIN_ID: '31337',
      VITE_CAMPAIGN_TITLE: 'Community garden',
      VITE_CAMPAIGN_DESCRIPTION: 'Raised beds for the block.',
    })
    expect(env.title).toBe('Community garden')
    expect(env.description).toBe('Raised beds for the block.')
  })
})
