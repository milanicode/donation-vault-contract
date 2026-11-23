import { explorerName, explorerUrl } from '../config/app.ts'
import { formatEth } from '../lib/format.ts'
import type { TxState, VaultAction } from '../hooks/useVaultWrite.ts'

function confirmedMessage(action: VaultAction): string {
  switch (action.kind) {
    case 'deposit':
      return `Donation of ${formatEth(action.value)} ETH confirmed. Thank you.`
    case 'withdraw':
      return 'Withdrawal confirmed. The funds are in the organizer wallet.'
    case 'claimRefund':
      return 'Refund confirmed. The ETH is back in your wallet.'
  }
}

function describe(state: Exclude<TxState, { phase: 'idle' }>): string {
  switch (state.phase) {
    case 'checking':
      return 'Checking the transaction…'
    case 'wallet':
      return 'Confirm the transaction in your wallet.'
    case 'confirming':
      return 'Transaction sent. Waiting for it to be confirmed…'
    case 'confirmed':
      return confirmedMessage(state.action)
    case 'failed':
      return state.message
  }
}

/** Live progress of the current transaction. Always mounted so screen readers hear updates. */
export function TxStatus({ state, onDismiss }: { state: TxState; onDismiss: () => void }) {
  const hash = 'hash' in state ? state.hash : undefined
  const url = hash ? explorerUrl('tx', hash) : undefined
  const finished = state.phase === 'confirmed' || state.phase === 'failed'

  return (
    <div aria-live="polite">
      {state.phase !== 'idle' && (
        <div className={`notice notice-${state.phase}`}>
          <p>{describe(state)}</p>
          <div className="notice-actions">
            {url && (
              <a href={url} target="_blank" rel="noreferrer noopener">
                View on {explorerName}
              </a>
            )}
            {finished && (
              <button type="button" className="link-button" onClick={onDismiss}>
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
