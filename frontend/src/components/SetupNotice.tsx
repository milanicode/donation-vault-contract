/** Shown instead of the campaign when the site has not been pointed at a contract. */
export function SetupNotice({ problems }: { problems: string[] }) {
  return (
    <section className="setup" aria-labelledby="setup-title">
      <h1 id="setup-title">This site is not connected to a contract yet</h1>
      <p className="lede">
        The page reads a deployed DonationVault, and its configuration is missing or invalid.
      </p>

      <div className="card">
        <h2>What needs fixing</h2>
        <ul className="problem-list">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>

        <h2>How to fix it</h2>
        <ol className="setup-steps">
          <li>
            Deploy the contract with <code>forge script script/DonationVault.s.sol</code> and note
            the contract address and the block number of the deployment.
          </li>
          <li>
            Copy <code>frontend/.env.example</code> to <code>frontend/.env.local</code>. The Sepolia
            portfolio needs <code>VITE_CHAIN_ID=11155111</code>. A local Anvil preview also needs{' '}
            <code>VITE_VAULT_ADDRESS</code>.
          </li>
          <li>
            Restart <code>npm run dev</code>, or rebuild the site. The values are read at build
            time.
          </li>
        </ol>
      </div>
    </section>
  )
}
