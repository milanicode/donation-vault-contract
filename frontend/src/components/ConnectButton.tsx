import { useEffect, useId, useRef, useState } from 'react'
import { useConnect, useConnectors, type Connector } from 'wagmi'
import { describeTxError } from '../lib/errors.ts'

/**
 * Connects a browser wallet. With one wallet installed it connects directly;
 * with several it lets the visitor pick.
 */
export function ConnectButton({
  label = 'Connect wallet',
  variant = 'secondary',
  block = false,
}: {
  label?: string
  variant?: 'primary' | 'secondary'
  block?: boolean
}) {
  const connectors = useConnectors()
  const { mutate: connect, isPending, error, reset } = useConnect()
  const [menuOpen, setMenuOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  // Wallets that announce themselves (EIP-6963) are listed by name. The generic
  // "injected" connector is the fallback for older wallets.
  const announced = connectors.filter((connector) => connector.id !== 'injected')
  const options = announced.length > 0 ? announced : connectors

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const connectWith = (connector: Connector) => {
    setMenuOpen(false)
    // No chain is requested here: declining a network switch would fail the
    // whole connection. The action panel offers the switch as its own step.
    connect({ connector })
  }

  const onClick = () => {
    reset()
    const only = options.length === 1 ? options[0] : undefined
    if (only) connectWith(only)
    else setMenuOpen((open) => !open)
  }

  return (
    <div className={block ? 'connect connect-block' : 'connect'} ref={containerRef}>
      <button
        type="button"
        className={`button button-${variant}${block ? ' button-block' : ''}`}
        onClick={onClick}
        disabled={isPending}
        aria-haspopup={options.length > 1 ? 'menu' : undefined}
        aria-expanded={options.length > 1 ? menuOpen : undefined}
        aria-controls={menuOpen ? menuId : undefined}
      >
        {isPending ? 'Connecting…' : label}
      </button>

      {menuOpen && (
        <div className="menu" id={menuId} role="menu" aria-label="Choose a wallet">
          {options.map((connector) => (
            <button
              key={connector.uid}
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={() => connectWith(connector)}
            >
              {connector.icon && <img src={connector.icon} alt="" width={20} height={20} />}
              {connector.name}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="connect-error" role="alert">
          {describeTxError(error)}
        </p>
      )}
    </div>
  )
}
