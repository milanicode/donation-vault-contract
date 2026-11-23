import { useConnection, useDisconnect } from 'wagmi'
import { chain, chainLabel } from '../config/app.ts'
import { SITE_NAME, SITE_PRODUCT, SITE_TITLE } from '../config/site.ts'
import { shortAddress } from '../lib/format.ts'
import { ConnectButton } from './ConnectButton.tsx'
import { ThemeToggle } from './ThemeToggle.tsx'

function Logo() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M9 20.5V14a7 7 0 0 1 14 0v6.5M7.5 20.5h17M11 24h10"
        fill="none"
        stroke="var(--bg)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Wallet() {
  const { address, chainId, isConnected } = useConnection()
  const { mutate: disconnect } = useDisconnect()

  if (!isConnected || !address) return <ConnectButton />

  const wrongNetwork = chainId !== chain.id
  return (
    <div className="wallet">
      <span className={wrongNetwork ? 'chip chip-warn' : 'chip'} title={address}>
        {wrongNetwork && <span className="chip-note">Wrong network</span>}
        <span className="mono">{shortAddress(address)}</span>
      </span>
      <button type="button" className="button button-quiet" onClick={() => disconnect()}>
        Disconnect
      </button>
    </div>
  )
}

export type SiteSection = 'campaigns' | 'about' | 'team'

const NAV: { section: SiteSection; href: string; label: string }[] = [
  { section: 'campaigns', href: '#/', label: 'Campaigns' },
  { section: 'about', href: '#/about', label: 'About' },
  { section: 'team', href: '#/team', label: 'Team' },
]

export function Header({
  showWallet,
  homeHref,
  section,
}: {
  showWallet: boolean
  homeHref: string
  section?: SiteSection
}) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" href={homeHref} aria-label={`${SITE_TITLE} home`}>
          <Logo />
          <span className="brand-text">
            <span className="brand-name">{SITE_NAME}</span>
            <span className="brand-product">{SITE_PRODUCT}</span>
          </span>
        </a>
        {section && (
          <nav className="site-nav" aria-label="Site">
            {NAV.map((item) => (
              <a
                key={item.section}
                href={item.href}
                aria-current={item.section === section ? 'page' : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}
        <div className="header-actions">
          <ThemeToggle />
          <span className="chip chip-network">
            <span className="dot" aria-hidden="true" />
            {chainLabel}
          </span>
          {showWallet && <Wallet />}
        </div>
      </div>
    </header>
  )
}
