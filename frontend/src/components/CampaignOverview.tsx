import {
  fundedPercent,
  progressFraction,
  STATUS_LABEL,
  type CampaignSnapshot,
  type CampaignStatus,
} from '../lib/campaign.ts'
import { formatCountdown, formatDateTime, formatEth } from '../lib/format.ts'

export function CampaignOverview({
  title,
  description,
  snapshot,
  status,
  now,
  donorCount,
  showBack = false,
}: {
  title: string
  description: string
  snapshot: CampaignSnapshot
  status: CampaignStatus
  /** Estimated chain time in seconds. */
  now: bigint
  donorCount: number | undefined
  showBack?: boolean
}) {
  const percent = fundedPercent(snapshot.totalDeposits, snapshot.goal)
  const fraction = progressFraction(snapshot.totalDeposits, snapshot.goal)
  const ended = status !== 'open'

  return (
    <section className="overview" aria-labelledby="campaign-title">
      {showBack && (
        <a className="back-link" href="#/">
          All campaigns
        </a>
      )}
      <p className={`status status-${status}`}>
        <span className="dot" aria-hidden="true" />
        {STATUS_LABEL[status]}
      </p>
      <h1 id="campaign-title">{title}</h1>
      <p className="lede">{description}</p>

      <div className="raised">
        <p className="raised-figure">
          <span className="raised-value">{formatEth(snapshot.totalDeposits)}</span>
          <span className="raised-unit">ETH</span>
        </p>
        <p className="raised-goal">raised of a {formatEth(snapshot.goal)} ETH goal</p>
      </div>

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

      <dl className="stats">
        <div>
          <dt>Funded</dt>
          <dd>{percent}%</dd>
        </div>
        <div>
          <dt>Donors</dt>
          <dd>{donorCount ?? '–'}</dd>
        </div>
        <div>
          <dt>{ended ? 'Ended' : 'Time left'}</dt>
          <dd title={formatDateTime(snapshot.endTime)}>
            {ended ? formatDateTime(snapshot.endTime) : formatCountdown(snapshot.endTime - now)}
          </dd>
        </div>
      </dl>
    </section>
  )
}
