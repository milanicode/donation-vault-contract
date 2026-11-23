export function About() {
  return (
    <article className="about" aria-labelledby="about-title">
      <header className="about-intro">
        <h1 id="about-title">About</h1>
        <p className="lede">
          MilaniCode Sepolia Fundraiser hosts all-or-nothing campaigns. A campaign collects toward a
          single goal until a deadline.
        </p>
      </header>
      <div className="about-grid">
        <section className="card">
          <h2>The rule</h2>
          <p>
            Contributions are held until that deadline. If the goal is reached, the organizer
            withdraws the funds. If it is not, every contributor can claim a full refund. Nobody,
            including the organizer, can take the money while the campaign is still open.
          </p>
        </section>
        <section className="card">
          <h2>The contract</h2>
          <p>
            Each campaign is a smart contract on the Ethereum Sepolia testnet, so the ether has no
            real value. The contract holds the funds and enforces the rule. This website reads that
            state and submits your transaction. It cannot change the outcome.
          </p>
        </section>
      </div>
    </article>
  )
}
