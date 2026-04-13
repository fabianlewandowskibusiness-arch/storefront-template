import type { LegalSection } from "@/lib/legal/templates";
import Container from "@/components/layout/Container";

interface LegalPageProps {
  title: string;
  sections: LegalSection[];
  storeName: string;
}

/**
 * Renders a legal page with structured heading + paragraph sections.
 * Uses clean, readable typography at a comfortable reading width.
 */
export default function LegalPage({ title, sections, storeName }: LegalPageProps) {
  return (
    <article className="bg-[var(--color-background)] py-12 md:py-16 lg:py-20">
      <Container narrow>
        {/* Back link */}
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-8"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Wróć do {storeName}
        </a>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-text)] leading-tight mb-10">
          {title}
        </h1>

        {/* Content sections */}
        <div className="space-y-10">
          {sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text)] mb-4">
                {section.heading}
              </h2>
              <div className="space-y-3">
                {section.paragraphs.map((p, j) => (
                  <p
                    key={j}
                    className="text-sm md:text-base text-[var(--color-text-muted)] leading-relaxed"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Last updated notice */}
        <div className="mt-16 pt-6 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-muted)]">
            Ostatnia aktualizacja: {new Date().toLocaleDateString("pl-PL", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </Container>
    </article>
  );
}
