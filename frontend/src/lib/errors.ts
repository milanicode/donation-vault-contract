/** Revert strings from DonationVault.sol, mapped to what a visitor should read. */
const REVERT_MESSAGES: ReadonlyArray<readonly [reason: string, message: string]> = [
  ['Campaign closed', 'The campaign has closed, so donations are no longer accepted.'],
  ['Campaign open', 'The campaign is still open. This becomes available after the deadline.'],
  ['Goal not met', 'The goal was not reached, so the organizer cannot withdraw.'],
  ['Goal met', 'The goal was reached, so refunds are not available.'],
  ['Nothing to refund', 'This wallet has no contribution to refund.'],
  ['Already withdrawn', 'The funds have already been withdrawn.'],
  ['Not owner', 'Only the campaign organizer can withdraw.'],
  ['No ETH sent', 'Enter an amount greater than zero.'],
  ['ETH transfer failed', 'The ETH transfer failed because the receiving account rejected it.'],
]

type ErrorLike = {
  name?: unknown
  code?: unknown
  message?: unknown
  shortMessage?: unknown
  details?: unknown
  cause?: unknown
}

/** Flattens an error and its `cause` chain; wallets nest the useful part at different depths. */
function collect(error: unknown): { names: string[]; codes: unknown[]; texts: string[] } {
  const names: string[] = []
  const codes: unknown[] = []
  const texts: string[] = []
  let current: unknown = error
  for (let depth = 0; depth < 10 && typeof current === 'object' && current !== null; depth++) {
    const e = current as ErrorLike
    if (typeof e.name === 'string') names.push(e.name)
    if (e.code !== undefined) codes.push(e.code)
    for (const text of [e.shortMessage, e.details, e.message]) {
      if (typeof text === 'string' && text) texts.push(text)
    }
    current = e.cause
  }
  if (typeof error === 'string') texts.push(error)
  return { names, codes, texts }
}

/** One sentence explaining why a wallet action failed. */
export function describeTxError(error: unknown): string {
  const { names, codes, texts } = collect(error)
  const all = texts.join('\n')

  if (
    names.includes('UserRejectedRequestError') ||
    codes.includes(4001) ||
    /user (rejected|denied)/i.test(all)
  ) {
    return 'You cancelled the request in your wallet.'
  }
  if (names.includes('ProviderNotFoundError')) {
    return 'No browser wallet was found. Install MetaMask or another Ethereum wallet, then reload this page.'
  }
  for (const [reason, message] of REVERT_MESSAGES) {
    if (all.includes(reason)) return message
  }
  if (/insufficient funds/i.test(all)) {
    return 'This wallet does not have enough ETH for the amount plus network fees.'
  }
  if (names.includes('ConnectorChainMismatchError') || /chain mismatch/i.test(all)) {
    return 'Your wallet is on a different network. Switch networks and try again.'
  }

  const first = texts[0]?.split('\n')[0]?.trim()
  return first ? first : 'Something went wrong. Please try again.'
}
