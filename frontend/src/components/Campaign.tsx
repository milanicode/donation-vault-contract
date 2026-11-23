import { useConnection } from 'wagmi'
import type { CampaignReading } from '../chain/reads.ts'
import { chainLabel } from '../config/app.ts'
import type { CampaignProfile } from '../config/campaigns.ts'
import { useCampaign } from '../hooks/useCampaign.ts'
import { useDonors } from '../hooks/useDonors.ts'
import { useNowMs } from '../hooks/useNow.ts'
import { deriveStatus, estimateChainNow } from '../lib/campaign.ts'
import { ActionPanel } from './ActionPanel.tsx'
import { CampaignOverview } from './CampaignOverview.tsx'
import { ContractDetails } from './ContractDetails.tsx'
import { DonorsTable, type DonorsState } from './DonorsTable.tsx'
import { HowItWorks } from './HowItWorks.tsx'

export function Campaign({
  profile,
  showBack = false,
}: {
  profile: CampaignProfile
  showBack?: boolean
}) {
  const campaign = useCampaign(profile.address)

  if (campaign.data) {
    return (
      <CampaignView
        profile={profile}
        showBack={showBack}
        reading={campaign.data}
        stale={campaign.isError}
      />
    )
  }

  if (campaign.isError) {
    return (
      <section className="setup" aria-labelledby="error-title">
        <h1 id="error-title">The campaign could not be loaded</h1>
        <p className="lede">
          No campaign contract answered at <span className="mono">{profile.address}</span> on {chainLabel}. The
          address may belong to another network, or the RPC endpoint may be unreachable.
        </p>
        <button
          type="button"
          className="button button-primary"
          onClick={() => void campaign.refetch()}
          disabled={campaign.isFetching}
        >
          {campaign.isFetching ? 'Retrying…' : 'Try again'}
        </button>
      </section>
    )
  }

  return (
    <div className="hero" aria-busy="true">
      <div className="overview">
        <p className="status status-closing">
          <span className="dot" aria-hidden="true" />
          Loading campaign…
        </p>
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-figure" />
        <div className="skeleton skeleton-bar" />
      </div>
      <div className="card skeleton skeleton-card" />
    </div>
  )
}

function CampaignView({
  profile,
  showBack,
  reading,
  stale,
}: {
  profile: CampaignProfile
  showBack: boolean
  reading: CampaignReading
  stale: boolean
}) {
  const { snapshot } = reading
  const nowMs = useNowMs()
  const now = estimateChainNow(reading.blockTimestamp, reading.fetchedAtMs, nowMs)
  const status = deriveStatus(snapshot, now)

  const { address } = useConnection()
  const donorsQuery = useDonors(
    profile.address,
    snapshot.endTime,
    snapshot.totalDeposits,
    profile.deployBlock,
  )

  let donors: DonorsState
  if (donorsQuery.data) {
    donors = { kind: 'ready', ...donorsQuery.data }
  } else if (donorsQuery.isError) {
    donors = { kind: 'error', retry: () => void donorsQuery.refetch() }
  } else {
    donors = { kind: 'loading' }
  }

  const hasDonated =
    address !== undefined &&
    donors.kind === 'ready' &&
    donors.donors.some((donor) => donor.address.toLowerCase() === address.toLowerCase())

  return (
    <>
      {stale && (
        <div className="notice notice-warn banner" role="status">
          <p>The network is not responding. This page shows the last state it could read.</p>
        </div>
      )}
      <div className="hero">
        <CampaignOverview
          title={profile.title}
          description={profile.description}
          snapshot={snapshot}
          status={status}
          now={now}
          donorCount={donors.kind === 'ready' && donors.complete ? donors.donors.length : undefined}
          showBack={showBack}
        />
        <ActionPanel
          vault={profile.address}
          snapshot={snapshot}
          status={status}
          hasDonated={hasDonated}
        />
      </div>
      <HowItWorks />
      <DonorsTable
        vault={profile.address}
        snapshot={snapshot}
        status={status}
        account={address}
        state={donors}
      />
      <ContractDetails vault={profile.address} snapshot={snapshot} />
    </>
  )
}
