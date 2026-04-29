export function App() {
  const cards = [
    { title: 'Operations', value: 'Dispatch Hub', detail: 'Instant and scheduled jobs' },
    { title: 'Providers', value: 'Verification', detail: 'Onboarding and compliance' },
    { title: 'Revenue', value: 'Commission', detail: 'Wallets, earnings, and payouts' },
  ];

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">KAZI Admin</p>
          <h1>Springbok-trust operations for a white-first services marketplace.</h1>
          <p className="lede">
            This foundation is aligned to the client brief: AWS deployment, Johannesburg launch,
            provider verification, and fast booking operations.
          </p>
        </div>
        <div className="heroBadge">af-south-1 ready</div>
      </section>

      <section className="grid">
        {cards.map((card) => (
          <article className="card" key={card.title}>
            <span>{card.title}</span>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </article>
        ))}
      </section>
    </main>
  );
}