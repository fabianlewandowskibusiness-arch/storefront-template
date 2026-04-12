import Container from "@/components/layout/Container";
import SectionShell, { type ShellOverride } from "@/components/layout/SectionShell";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/storefront/Reveal";

interface ComparisonRow {
  label: string;
  ours: string;
  other: string;
}

interface ComparisonSectionProps {
  title: string;
  subtitle?: string;
  brandName: string;
  rows: ComparisonRow[];
  /** Product image URL — usually the first HERO gallery image. */
  productImage?: string;
  shellOverride?: ShellOverride;
}

// ── Inline icons — clean UI style, no emoji ───────────────────────────────────

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CrossIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ── Row renderer ──────────────────────────────────────────────────────────────
//
// A comparison row is rendered as a bullet with:
//   <icon>  <bold label — if present> <effect sentence>
//
// The label becomes a lead-in prefix rather than a standalone column, so the
// sentence flows naturally instead of reading like a spreadsheet cell.

interface BulletProps {
  label: string;
  text: string;
  tone: "positive" | "negative";
}

function Bullet({ label, text, tone }: BulletProps) {
  const hasLabel = label.trim().length > 0;
  const isPositive = tone === "positive";

  return (
    <li className="flex items-start gap-3">
      <span
        className={`shrink-0 mt-0.5 ${
          isPositive
            ? "text-[var(--color-success)]"
            : "text-red-400"
        }`}
      >
        {isPositive ? (
          <CheckIcon className="w-5 h-5" />
        ) : (
          <CrossIcon className="w-5 h-5" />
        )}
      </span>
      <span
        className={`text-sm leading-relaxed ${
          isPositive ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"
        }`}
      >
        {hasLabel && (
          <strong
            className={`font-semibold ${
              isPositive ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"
            }`}
          >
            {label}
            {text ? " — " : ""}
          </strong>
        )}
        {text}
      </span>
    </li>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ComparisonSection({
  title,
  subtitle,
  brandName,
  rows,
  productImage,
  shellOverride,
}: ComparisonSectionProps) {
  if (rows.length === 0) return null;

  // Mini bridge strip — takes the first 3 rows, shows their positive effect
  // as icon cards below the comparison. Renders only when there are enough
  // rows to make a believable bridge into the Benefits section.
  const bridgeItems = rows.slice(0, 3);
  const showBridge = rows.length >= 3;

  return (
    <SectionShell override={shellOverride}>
      <Container>
        <Reveal>
          <SectionHeading title={title} subtitle={subtitle} />
        </Reveal>

        {/* ── Two-column decision block ───────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto items-stretch">
          {/* ── LEFT / product — the recommended card ──────────────────── */}
          <Reveal>
            <article
              className="relative h-full bg-[var(--color-accent-soft)] border-2 border-[var(--color-accent)] rounded-[var(--radius)] p-6 md:p-8 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl lg:scale-[1.02]"
            >
              {/* Ribbon badge */}
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-[var(--color-accent)] text-white rounded-full shadow-md">
                Twój wybór
              </span>

              {/* Product image slot */}
              {productImage && (
                <div className="flex justify-center mb-5">
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-[var(--radius)] overflow-hidden bg-white shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={productImage}
                      alt={brandName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}

              {/* Column title */}
              <h3 className="text-xl md:text-2xl font-bold text-[var(--color-accent)] text-center mb-5">
                {brandName}
              </h3>

              {/* Benefit list */}
              <ul className="space-y-3">
                {rows.map((row, i) => (
                  <Bullet
                    key={`us-${i}`}
                    label={row.label}
                    text={row.ours}
                    tone="positive"
                  />
                ))}
              </ul>

              {/* Closing reinforcement line */}
              <p className="mt-6 pt-4 border-t border-[var(--color-accent)]/20 text-xs text-center text-[var(--color-accent)] font-semibold">
                Zaprojektowana, by rozwiązać problem — nie go ukryć.
              </p>
            </article>
          </Reveal>

          {/* ── RIGHT / competitors — the muted card ───────────────────── */}
          <Reveal delayMs={120}>
            <article
              className="relative h-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius)] p-6 md:p-8 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* Muted badge */}
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-[var(--color-text-muted)] text-white rounded-full">
                Typowe poduszki
              </span>

              {/* Visual placeholder to keep card heights aligned on desktop.
                  The left card has an image block; this empty spacer mirrors
                  its height so the two columns stay symmetric. */}
              {productImage && (
                <div className="flex justify-center mb-5" aria-hidden="true">
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-[var(--radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-background)] flex items-center justify-center text-[var(--color-text-muted)]">
                    <svg
                      className="w-8 h-8 opacity-40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* Column title */}
              <h3 className="text-xl md:text-2xl font-semibold text-[var(--color-text-muted)] text-center mb-5">
                Konkurencja
              </h3>

              {/* Problem list */}
              <ul className="space-y-3">
                {rows.map((row, i) => (
                  <Bullet
                    key={`them-${i}`}
                    label={row.label}
                    text={row.other}
                    tone="negative"
                  />
                ))}
              </ul>

              {/* Closing line — deliberately downbeat */}
              <p className="mt-6 pt-4 border-t border-[var(--color-border)] text-xs text-center text-[var(--color-text-muted)]">
                Kompromisowe rozwiązania. Te same problemy wracają.
              </p>
            </article>
          </Reveal>
        </div>

        {/* ── Mini bridge row — bridges into BENEFITS ───────────────────── */}
        {showBridge && (
          <div className="mt-10 md:mt-14 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {bridgeItems.map((item, i) => (
              <Reveal key={`bridge-${i}`} index={i}>
                <div className="flex items-start gap-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius)] p-4 h-full">
                  <span className="shrink-0 mt-0.5 text-[var(--color-accent)]">
                    <CheckIcon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    {item.label && (
                      <p className="font-semibold text-xs text-[var(--color-text)] mb-0.5">
                        {item.label}
                      </p>
                    )}
                    <p className="text-xs text-[var(--color-text-muted)] leading-snug">
                      {item.ours}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </SectionShell>
  );
}
