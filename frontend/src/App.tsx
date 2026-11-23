import { useEffect } from 'react'
import { About } from './components/About.tsx'
import { Campaign } from './components/Campaign.tsx'
import { Catalog } from './components/Catalog.tsx'
import { Header, type SiteSection } from './components/Header.tsx'
import { SetupNotice } from './components/SetupNotice.tsx'
import { Team } from './components/Team.tsx'
import { env, problems } from './config/app.ts'
import { findCampaign } from './config/campaigns.ts'
import { ANVIL_ID } from './config/env.ts'
import { AUTHOR_GITHUB, SITE_TITLE } from './config/site.ts'
import { useRoute } from './hooks/useRoute.ts'

export function App() {
  const setup = setupProblems()
  const route = useRoute()
  const portfolio = env.chainId !== ANVIL_ID

  useEffect(() => {
    if (!portfolio) return
    const page =
      route.kind === 'about'
        ? 'About'
        : route.kind === 'team'
          ? 'Team'
          : route.kind === 'campaign'
            ? (findCampaign(route.id)?.title ?? 'Campaign')
            : route.kind === 'missing'
              ? 'Page not found'
              : 'Campaigns'
    document.title = `${page} · ${SITE_TITLE}`
    window.scrollTo(0, 0)
  }, [portfolio, route])

  let body
  if (setup.length > 0) {
    body = <SetupNotice problems={setup} />
  } else if (!portfolio) {
    body = (
      <Campaign
        profile={{
          id: 'local',
          title: env.title,
          description: env.description,
          address: env.vaultAddress!,
          deployBlock: env.deployBlock,
        }}
      />
    )
  } else if (route.kind === 'campaign') {
    const profile = findCampaign(route.id)
    body = profile ? (
      <Campaign profile={profile} showBack />
    ) : (
      <section className="setup" aria-labelledby="missing-title">
        <h1 id="missing-title">That campaign is not listed</h1>
        <p className="lede">The link does not match one of the campaigns.</p>
        <a className="button button-primary" href="#/">
          All campaigns
        </a>
      </section>
    )
  } else if (route.kind === 'missing') {
    body = (
      <section className="setup" aria-labelledby="missing-title">
        <h1 id="missing-title">That page does not exist</h1>
        <p className="lede">Use the menu to get back to the campaigns.</p>
        <a className="button button-primary" href="#/">
          All campaigns
        </a>
      </section>
    )
  } else if (route.kind === 'about') {
    body = <About />
  } else if (route.kind === 'team') {
    body = <Team />
  } else {
    body = <Catalog />
  }

  return (
    <>
      <Header
        showWallet={setup.length === 0}
        homeHref={portfolio ? '#/' : './'}
        section={portfolio && setup.length === 0 ? siteSection(route.kind) : undefined}
      />
      <main className="container">{body}</main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <p>
            {portfolio
              ? `${SITE_TITLE}. Campaigns run on the Sepolia testnet, so the ETH has no real value.`
              : 'Local demonstration. The ETH used here has no real value.'}
          </p>
          <a href={AUTHOR_GITHUB} target="_blank" rel="noreferrer noopener">
            GitHub
          </a>
        </div>
      </footer>
    </>
  )
}

function siteSection(kind: string): SiteSection | undefined {
  if (kind === 'about') return 'about'
  if (kind === 'team') return 'team'
  if (kind === 'catalog' || kind === 'campaign') return 'campaigns'
  return undefined
}

function setupProblems(): string[] {
  if (problems.length > 0) return problems
  if (env.chainId === ANVIL_ID && env.vaultAddress === null) {
    return ['VITE_VAULT_ADDRESS is not set. It must be the deployed DonationVault address.']
  }
  return []
}
