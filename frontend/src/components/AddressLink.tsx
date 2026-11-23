import type { Address } from 'viem'
import { explorerUrl } from '../config/app.ts'
import { shortAddress } from '../lib/format.ts'

/** An address that links to the block explorer when the chain has one. */
export function AddressLink({ address, full = false }: { address: Address; full?: boolean }) {
  const text = full ? address : shortAddress(address)
  const url = explorerUrl('address', address)
  if (!url) {
    return (
      <span className="mono" title={address}>
        {text}
      </span>
    )
  }
  return (
    <a className="mono" href={url} target="_blank" rel="noreferrer noopener" title={address}>
      {text}
    </a>
  )
}
