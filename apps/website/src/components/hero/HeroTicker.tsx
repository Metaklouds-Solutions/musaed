export default function HeroTicker({ items }: { items: string[] }) {
  const tickerItems = [...items, ...items];

  return (
    <div
      className="overflow-hidden py-3.5"
      style={{
        background: "rgba(255, 255, 255, 0.14)",
        backdropFilter: "blur(28px) saturate(1.6)",
        WebkitBackdropFilter: "blur(28px) saturate(1.6)",
        borderTop: "1px solid rgba(255, 255, 255, 0.18)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.18)",
      }}
    >
      <div className="hero-ticker-track px-4 sm:px-6 lg:px-8">
        {tickerItems.map((item, index) => (
          <div key={`${item}-${index}`} className="hero-ticker-item">
            <span className="hero-ticker-dot" aria-hidden="true" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
