import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import type { Address, Hash } from 'viem'
import { simulateContract, waitForTransactionReceipt } from 'viem/actions'
import { useConnection, useWriteContract } from 'wagmi'
import { donationVaultAbi } from '../abi/donationVault.ts'
import { chain, publicClient } from '../config/app.ts'
import { describeTxError } from '../lib/errors.ts'

export type VaultAction =
  | { kind: 'deposit'; value: bigint }
  | { kind: 'withdraw' }
  | { kind: 'claimRefund' }

export type TxState =
  | { phase: 'idle' }
  | { phase: 'checking' | 'wallet'; action: VaultAction }
  | { phase: 'confirming' | 'confirmed'; action: VaultAction; hash: Hash }
  | { phase: 'failed'; action: VaultAction; message: string; hash: Hash | undefined }

/** Sends one vault transaction at a time and reports each step of its progress. */
export function useVaultWrite(vault: Address) {
  const { address: account } = useConnection()
  const { mutateAsync: writeContract } = useWriteContract()
  const queryClient = useQueryClient()
  const [state, setState] = useState<TxState>({ phase: 'idle' })

  // A result belongs to the account that produced it.
  useEffect(() => setState({ phase: 'idle' }), [account])

  const run = useCallback(
    async (action: VaultAction): Promise<boolean> => {
      if (!account) return false
      const contract = { address: vault, abi: donationVaultAbi } as const
      let hash: Hash | undefined
      try {
        setState({ phase: 'checking', action })
        // Simulating first explains a revert before the wallet asks for a signature.
        if (action.kind === 'deposit') {
          await simulateContract(publicClient, {
            ...contract,
            functionName: 'deposit',
            value: action.value,
            account,
          })
        } else {
          await simulateContract(publicClient, { ...contract, functionName: action.kind, account })
        }

        setState({ phase: 'wallet', action })
        hash =
          action.kind === 'deposit'
            ? await writeContract({
                ...contract,
                functionName: 'deposit',
                value: action.value,
                chainId: chain.id,
              })
            : await writeContract({ ...contract, functionName: action.kind, chainId: chain.id })

        setState({ phase: 'confirming', action, hash })
        const receipt = await waitForTransactionReceipt(publicClient, { hash })
        if (receipt.status !== 'success') {
          throw new Error('The transaction was included in a block but reverted.')
        }
        setState({ phase: 'confirmed', action, hash })
        return true
      } catch (error) {
        setState({ phase: 'failed', action, message: describeTxError(error), hash })
        return false
      } finally {
        // Whatever happened, what is on screen may now be out of date.
        void queryClient.invalidateQueries()
      }
    },
    [account, vault, writeContract, queryClient],
  )

  const reset = useCallback(() => setState({ phase: 'idle' }), [])
  const busy = state.phase === 'checking' || state.phase === 'wallet' || state.phase === 'confirming'

  return { state, run, reset, busy }
}
