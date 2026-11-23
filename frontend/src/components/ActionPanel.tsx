import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { Address } from 'viem'
import { useBalance, useConnection, useReadContract, useSwitchChain } from 'wagmi'
import { donationVaultAbi } from '../abi/donationVault.ts'
import { chain, chainLabel } from '../config/app.ts'
import { useVaultWrite } from '../hooks/useVaultWrite.ts'
import { formatShare, type CampaignSnapshot, type CampaignStatus } from '../lib/campaign.ts'
import { describeTxError } from '../lib/errors.ts'
import { formatEth, parseEthAmount } from '../lib/format.ts'
import { ConnectButton } from './ConnectButton.tsx'
import { TxStatus } from './TxStatus.tsx'

const PRESETS = ['0.01', '0.05', '0.1']

const TITLE: Record<CampaignStatus, string> = {
  open: 'Make a donation',
  closing: 'Campaign closing',
  succeeded: 'Goal reached',
  withdrawn: 'Campaign completed',
  failed: 'Refunds are open',
}

export function ActionPanel({
  vault,
  snapshot,
  status,
  hasDonated,
}: {
  vault: Address
  snapshot: CampaignSnapshot
  status: CampaignStatus
  /** Whether the connected wallet appears in the donor list. */
  hasDonated: boolean
}) {
  const { address, chainId, isConnected } = useConnection()
  const connected = isConnected && address !== undefined
  const wrongNetwork = connected && chainId !== chain.id
  const isOwner = connected && address.toLowerCase() === snapshot.owner.toLowerCase()

  const { data: deposited } = useReadContract({
    address: vault,
    abi: donationVaultAbi,
    functionName: 'deposited',
    args: address ? [address] : undefined,
    chainId: chain.id,
    query: { enabled: connected },
  })
  const { data: balance } = useBalance({
    address,
    chainId: chain.id,
    query: { enabled: connected },
  })

  const { state, run, reset, busy } = useVaultWrite(vault)
  const switchChain = useSwitchChain()

  const [amount, setAmount] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const amountRef = useRef<HTMLInputElement>(null)

  const parsed = parseEthAmount(amount)
  let amountError: string | undefined
  if (amount.trim() === '') {
    if (submitted && !parsed.ok) amountError = parsed.error
  } else if (!parsed.ok) {
    amountError = parsed.error
  } else if (connected && balance && parsed.wei > balance.value) {
    amountError = 'This is more than the wallet balance.'
  }

  const onDonate = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (!parsed.ok || amountError) {
      amountRef.current?.focus()
      return
    }
    const confirmed = await run({ kind: 'deposit', value: parsed.wei })
    if (confirmed) {
      setAmount('')
      setSubmitted(false)
    }
  }

  /** Shows the step that must come first: connect, then switch network, then act. */
  const gate = (action: ReactNode, connectLabel: string): ReactNode => {
    if (!connected) return <ConnectButton label={connectLabel} variant="primary" block />
    if (wrongNetwork) {
      return (
        <>
          <button
            type="button"
            className="button button-primary button-block"
            onClick={() => switchChain.mutate({ chainId: chain.id })}
            disabled={switchChain.isPending}
          >
            {switchChain.isPending ? 'Switching…' : `Switch to ${chainLabel}`}
          </button>
          {switchChain.error && (
            <p className="field-error" role="alert">
              {describeTxError(switchChain.error)}
            </p>
          )}
        </>
      )
    }
    return action
  }

  const contribution =
    connected && deposited !== undefined && deposited > 0n ? (
      <p className="contribution">
        <span>Your contribution</span>
        <strong>
          {formatEth(deposited)} ETH
          <span className="contribution-share">
            {formatShare(deposited, snapshot.totalDeposits)} of the total
          </span>
        </strong>
      </p>
    ) : null

  let body: ReactNode
  switch (status) {
    case 'open':
      body = (
        <form onSubmit={onDonate} noValidate>
          <label className="field-label" htmlFor="amount">
            Amount
          </label>
          <div className={amountError ? 'amount amount-invalid' : 'amount'}>
            <input
              id="amount"
              ref={amountRef}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              aria-invalid={amountError !== undefined}
              aria-describedby="amount-help"
              disabled={busy}
            />
            <span className="amount-unit">ETH</span>
          </div>
          <div className="presets" role="group" aria-label="Suggested amounts">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className="preset"
                onClick={() => setAmount(preset)}
                aria-pressed={amount === preset}
                disabled={busy}
              >
                {preset}
              </button>
            ))}
          </div>
          <p id="amount-help" className={amountError ? 'field-error' : 'field-hint'}>
            {amountError ??
              (connected && balance
                ? `Wallet balance: ${formatEth(balance.value)} ETH`
                : 'Testnet ETH only. It has no real value.')}
          </p>
          {gate(
            <button type="submit" className="button button-primary button-block" disabled={busy}>
              {parsed.ok && !amountError ? `Donate ${formatEth(parsed.wei, 6)} ETH` : 'Donate'}
            </button>,
            'Connect wallet to donate',
          )}
          <p className="fine-print">
            If the goal is not reached by the deadline, you can claim a full refund.
          </p>
        </form>
      )
      break

    case 'closing':
      body = (
        <p>
          The deadline has passed. The result becomes final when the network produces its next
          block.
        </p>
      )
      break

    case 'succeeded':
      body = isOwner ? (
        <>
          <p>The campaign reached its goal. As the organizer, you can withdraw the funds.</p>
          {gate(
            <button
              type="button"
              className="button button-primary button-block"
              onClick={() => void run({ kind: 'withdraw' })}
              disabled={busy}
            >
              Withdraw {formatEth(snapshot.totalDeposits)} ETH
            </button>,
            'Connect wallet',
          )}
        </>
      ) : (
        <>
          <p>The campaign reached its goal. The organizer can now withdraw the funds.</p>
          {!connected && <ConnectButton label="Organizer? Connect wallet" block />}
        </>
      )
      break

    case 'withdrawn':
      body = (
        <p>
          The campaign reached its goal and the organizer withdrew{' '}
          {formatEth(snapshot.totalDeposits)} ETH.
        </p>
      )
      break

    case 'failed':
      if (!connected) {
        body = (
          <>
            <p>The campaign ended below its goal. Every donor can claim a full refund.</p>
            <ConnectButton label="Connect wallet to claim a refund" variant="primary" block />
          </>
        )
      } else if (deposited === undefined) {
        body = <p>Checking this wallet for a refund…</p>
      } else if (deposited > 0n) {
        body = (
          <>
            <p>The campaign ended below its goal. You can claim back your full donation.</p>
            {gate(
              <button
                type="button"
                className="button button-primary button-block"
                onClick={() => void run({ kind: 'claimRefund' })}
                disabled={busy}
              >
                Claim refund of {formatEth(deposited)} ETH
              </button>,
              'Connect wallet',
            )}
          </>
        )
      } else if (hasDonated) {
        body = <p>The campaign ended below its goal. This wallet has claimed its refund.</p>
      } else {
        body = (
          <p>
            The campaign ended below its goal. This wallet did not donate, so it has nothing to
            refund.
          </p>
        )
      }
      break
  }

  return (
    <section className="card action" aria-labelledby="action-title">
      <h2 id="action-title">{TITLE[status]}</h2>
      {body}
      {status !== 'failed' && contribution}
      <TxStatus state={state} onDismiss={reset} />
    </section>
  )
}
