const STEPS = [
  {
    title: 'Donate before the deadline',
    text: 'Anyone can send ETH to the contract while the campaign is open. Each donation is recorded on-chain under the donor’s address.',
  },
  {
    title: 'The contract holds the funds',
    text: 'Until the deadline, nobody can move the ETH out of the contract. That includes the organizer.',
  },
  {
    title: 'One of two outcomes',
    text: 'If the goal is reached, the organizer withdraws everything raised. If it is not, each donor claims back exactly what they gave.',
  },
]

export function HowItWorks() {
  return (
    <section className="section" aria-labelledby="how-title">
      <div className="section-head">
        <h2 id="how-title">How it works</h2>
      </div>
      <ol className="steps">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <span className="step-number" aria-hidden="true">
              {index + 1}
            </span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
      <p className="section-note">The rules are enforced by the contract, not by this website.</p>
    </section>
  )
}
