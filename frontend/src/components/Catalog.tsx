import { useQueries } from '@tanstack/react-query'
import type { CampaignProfile } from '../config/campaigns.ts'
import { portfolioCampaigns } from '../config/campaigns.ts'
import { campaignQueryOptions, useCampaign } from '../hooks/useCampaign.ts'
import { useNowMs } from '../hooks/useNow.ts'
import {
  estimateChainNow,
  fundedPercent,
  progressFraction,
  STATUS_LABEL,
  deriveStatus,
  type CampaignStatus,
} from '../lib/campaign.ts'
import { formatCountdown, formatDateTime, formatEth } from '../lib/format.ts'

export function Catalog() {
  const nowMs = useNowMs()
  const results = useQueries({
    queries: portfolioCampaigns.map((profile) => campaignQueryOptions(profile.address)),
  })

  const live: CampaignProfile[] = []
  const ended: CampaignProfile[] = []
  const pending: CampaignProfile[] = []
  const failed: CampaignProfile[] = []

  portfolioCampaigns.forEach((profile, index) => {
    const query = results[index]
    if (!query?.data) {
      if (query?.isError) failed.push(profile)
      else pending.push(profile)
      return
    }
    const now = estimateChainNow(query.data.blockTimestamp, query.data.fetchedAtMs, nowMs)
    const status = deriveStatus(query.data.snapshot, now)
    if (isLive(status)) live.push(profile)
    else ended.push(profile)
  })

  const settled = pending.length === 0

  return (
    <div className="catalog">
      <header className="catalog-intro">
        <h1 id="catalog-title">Campaigns</h1>
        <p className="lede">Choose a project and contribute.</p>
      </header>

      <section className="catalog-section" aria-labelledby="live-title">
        <h2 id="live-title">Live</h2>
        <div className="catalog-grid">
          {live.map((profile) => (
            <CampaignCard key={profile.id} profile={profile} />
          ))}
          {pending.map((profile) => (
            <article key={profile.id} className="campaign-card" aria-busy="true">
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-bar" />
            </article>
          ))}
          {failed.map((profile) => (
            <CampaignCard key={profile.id} profile={profile} />
          ))}
        </div>
        {settled && live.length === 0 && failed.length === 0 && (
          <p className="catalog-empty">No campaigns are open.</p>
        )}
      </section>

      {(ended.length > 0 || settled) && (
        <section className="catalog-section" aria-labelledby="ended-title">
          <h2 id="ended-title">Ended</h2>
          {ended.length > 0 ? (
            <div className="catalog-grid">
              {ended.map((profile) => (
                <CampaignCard key={profile.id} profile={profile} />
              ))}
            </div>
          ) : (
            <p className="catalog-empty">No campaigns have ended.</p>
          )}
        </section>
      )}
    </div>
  )
}

function isLive(status: CampaignStatus): boolean {
  return status === 'open' || status === 'closing'
}

function CampaignCard({ profile }: { profile: CampaignProfile }) {
  const campaign = useCampaign(profile.address)
  const nowMs = useNowMs()

  if (!campaign.data) {
    if (campaign.isError) {
      return (
        <article className="campaign-card">
          <h2>{profile.title}</h2>
          <p className="lede">This campaign could not be read.</p>
          <button
            type="button"
            className="button button-primary card-retry"
            onClick={() => void campaign.refetch()}
            disabled={campaign.isFetching}
          >
            {campaign.isFetching ? 'Retrying…' : 'Try again'}
          </button>
        </article>
      )
    }
    return (
      <article className="campaign-card" aria-busy="true">
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-bar" />
      </article>
    )
  }

  const { snapshot } = campaign.data
  const now = estimateChainNow(campaign.data.blockTimestamp, campaign.data.fetchedAtMs, nowMs)
  const status = deriveStatus(snapshot, now)
  const ended = !isLive(status)
  const percent = fundedPercent(snapshot.totalDeposits, snapshot.goal)
  const fraction = progressFraction(snapshot.totalDeposits, snapshot.goal)

  return (
    <a className="campaign-card" href={`#/c/${profile.id}`}>
      <p className={`status status-${status}`}>
        <span className="dot" aria-hidden="true" />
        {STATUS_LABEL[status]}
      </p>
      <h2>{profile.title}</h2>
      <p className="lede">{profile.description}</p>
      <p className="card-raised">
        <span>{formatEth(snapshot.totalDeposits)}</span>
        <span className="card-unit">ETH</span>
      </p>
      <p className="card-goal">
        {percent}% of {formatEth(snapshot.goal)} ETH
      </p>
      <div
        className="progress"
        role="progressbar"
        aria-label="Funding progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(percent, 100)}
        aria-valuetext={`${percent}% of the goal`}
      >
        <div className="progress-fill" style={{ width: `${fraction * 100}%` }} />
      </div>
      <p className="card-deadline">
        {ended ? 'Ended' : 'Time left'}{' '}
        <span>
          {ended ? formatDateTime(snapshot.endTime) : formatCountdown(snapshot.endTime - now)}
        </span>
      </p>
    </a>
  )
}
