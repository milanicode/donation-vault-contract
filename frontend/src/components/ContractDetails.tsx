import { useEffect, useState } from 'react'
import type { Address } from 'viem'
import { chain, chainLabel, env } from '../config/app.ts'
import type { CampaignSnapshot } from '../lib/campaign.ts'
import { formatDateTime, formatEth } from '../lib/format.ts'
import { AddressLink } from './AddressLink.tsx'

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(id)
  }, [copied])

  // The Clipboard API only exists on HTTPS and localhost.
  if (!navigator.clipboard) return null

  return (
    <button
      type="button"
      className="link-button"
      onClick={() => {
        navigator.clipboard.writeText(value).then(
          () => setCopied(true),
          () => setCopied(false),
        )
      }}
    >
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

export function ContractDetails({
  vault,
  snapshot,
}: {
  vault: Address
  snapshot: CampaignSnapshot
}) {
  return (
    <section className="section" aria-labelledby="contract-title">
      <div className="section-head">
        <h2 id="contract-title">Contract</h2>
      </div>
      <dl className="details">
        <div>
          <dt>Address</dt>
          <dd>
            <AddressLink address={vault} full />
            <CopyButton value={vault} />
          </dd>
        </div>
        <div>
          <dt>Organizer</dt>
          <dd>
            <AddressLink address={snapshot.owner} full />
          </dd>
        </div>
        <div>
          <dt>Network</dt>
          <dd>
            {chainLabel} <span className="muted">(chain ID {chain.id})</span>
          </dd>
        </div>
        <div>
          <dt>Goal</dt>
          <dd>{formatEth(snapshot.goal, 18)} ETH</dd>
        </div>
        <div>
          <dt>Deadline</dt>
          <dd>
            {formatDateTime(snapshot.endTime)}{' '}
            <span className="muted">(Unix time {snapshot.endTime.toString()})</span>
          </dd>
        </div>
        {env.repoUrl && (
          <div>
            <dt>Source code</dt>
            <dd>
              <a href={env.repoUrl} target="_blank" rel="noreferrer noopener">
                {env.repoUrl.replace(/^https?:\/\//, '')}
              </a>
            </dd>
          </div>
        )}
      </dl>
      <p className="section-note">
        Everything on this page is read directly from the deployed contract.
      </p>
    </section>
  )
}
