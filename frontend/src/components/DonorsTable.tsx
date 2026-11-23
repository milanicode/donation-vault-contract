import { useState } from 'react'
import type { Address } from 'viem'
import { useRefundedDonors } from '../hooks/useDonors.ts'
import { formatShare, type CampaignSnapshot, type CampaignStatus } from '../lib/campaign.ts'
import type { Donor } from '../lib/donors.ts'
import { formatEth } from '../lib/format.ts'
import { AddressLink } from './AddressLink.tsx'

const COLLAPSED_ROWS = 25

export type DonorsState =
  | { kind: 'loading' }
  | { kind: 'error'; retry: () => void }
  | { kind: 'ready'; donors: Donor[]; complete: boolean }

export function DonorsTable({
  vault,
  snapshot,
  status,
  account,
  state,
}: {
  vault: Address
  snapshot: CampaignSnapshot
  status: CampaignStatus
  account: Address | undefined
  state: DonorsState
}) {
  const [expanded, setExpanded] = useState(false)
  const donors = state.kind === 'ready' ? state.donors : []
  const failed = status === 'failed'
  const { data: refunded } = useRefundedDonors(
    vault,
    donors.map((donor) => donor.address),
    failed,
  )

  const visible = expanded ? donors : donors.slice(0, COLLAPSED_ROWS)
  const same = (a: Address, b: Address | undefined) => a.toLowerCase() === b?.toLowerCase()

  return (
    <section className="section" aria-labelledby="donors-title">
      <div className="section-head">
        <h2 id="donors-title">Contributions</h2>
      </div>

      {state.kind === 'loading' && <p className="empty">Loading contributions…</p>}

      {state.kind === 'error' && (
        <div className="notice notice-failed">
          <p>
            The contributions could not be loaded from the network. The RPC endpoint may be
            rate-limited or may reject the size of the event query.
          </p>
          <div className="notice-actions">
            <button type="button" className="link-button" onClick={state.retry}>
              Try again
            </button>
          </div>
        </div>
      )}

      {state.kind === 'ready' && donors.length === 0 && state.complete && (
        <p className="empty">
          {status === 'open' ? 'No donations yet.' : 'The campaign ended without any donations.'}
        </p>
      )}

      {state.kind === 'ready' && !state.complete && (
        <div className="notice notice-warn">
          <p>
            This list does not add up to the {formatEth(snapshot.totalDeposits)} ETH recorded by
            the contract, so some donations are missing. It will refresh automatically.
          </p>
        </div>
      )}

      {donors.length > 0 && (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col" className="col-rank">
                    #
                  </th>
                  <th scope="col">Donor</th>
                  <th scope="col" className="num col-count">
                    Donations
                  </th>
                  <th scope="col" className="num">
                    Amount
                  </th>
                  <th scope="col" className="num">
                    Share
                  </th>
                  {failed && <th scope="col">Refund</th>}
                </tr>
              </thead>
              <tbody>
                {visible.map((donor, index) => (
                  <tr key={donor.address} className={same(donor.address, account) ? 'row-you' : ''}>
                    <td className="col-rank">{index + 1}</td>
                    <td>
                      <AddressLink address={donor.address} />
                      {same(donor.address, account) && <span className="tag">You</span>}
                      {same(donor.address, snapshot.owner) && (
                        <span className="tag tag-quiet">Organizer</span>
                      )}
                    </td>
                    <td className="num col-count">{donor.deposits}</td>
                    <td className="num">{formatEth(donor.amount)} ETH</td>
                    <td className="num">{formatShare(donor.amount, snapshot.totalDeposits)}</td>
                    {failed && (
                      <td>
                        {refunded === undefined
                          ? '–'
                          : refunded.has(donor.address)
                            ? 'Claimed'
                            : 'Available'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {donors.length > COLLAPSED_ROWS && (
            <button
              type="button"
              className="link-button table-more"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? 'Show fewer' : `Show all ${donors.length} donors`}
            </button>
          )}
        </>
      )}
      <p className="section-note">
        Built from the contract’s <code>Deposit</code> events. A share is that donor’s part of
        everything raised.
      </p>
    </section>
  )
}
