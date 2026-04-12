interface AnnouncementTickerProps {
  items: string[];
}

/**
 * Infinite horizontal marquee — pure CSS.
 * Implementation:
 *   - render the items twice, back-to-back, inside a flex track
 *   - animate translateX from 0 to -50% (= exactly one copy's width)
 *   - the second copy takes over visually at the wrap point — no jump
 *
 * Pause on hover is handled by `.marquee-container:hover .marquee-track`
 * in globals.css. Edge fade-out is applied via the `edge-fade-x` mask.
 *
 * No JavaScript, no libraries, GPU-accelerated (transform only).
 */
export default function AnnouncementTicker({ items }: AnnouncementTickerProps) {
  if (items.length === 0) return null;

  // Duplicate the list so the CSS loop can be seamless.
  const doubled = [...items, ...items];

  return (
    <div
      className="marquee-container bg-[var(--color-accent)] text-white overflow-hidden edge-fade-x"
      role="region"
      aria-label="Ogłoszenia sklepu"
    >
      <div className="marquee-track flex w-max whitespace-nowrap py-2.5">
        {doubled.map((text, i) => (
          <span
            key={i}
            className="px-8 text-sm font-medium tracking-wide flex items-center gap-2"
            aria-hidden={i >= items.length ? "true" : undefined}
          >
            {text}
            <span className="text-white/40" aria-hidden="true">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
