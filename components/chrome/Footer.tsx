"use client";

import { useSectionRegistry } from "@/lib/stores/sectionRegistry";
import Container from "@/components/layout/Container";
import type {
  BrandingConfig,
  LegalPagesConfig,
  LegalPageEntry,
  LegalPageKey,
} from "@/types/storefront";

interface FooterProps {
  branding: BrandingConfig;
  legalPages?: LegalPagesConfig | null;
  contactEmail?: string;
}

// ── Legal page order ──────────────────────────────────────────────────────────

const LEGAL_ORDER: LegalPageKey[] = [
  "returns",
  "shipping",
  "privacy",
  "terms",
  "contact",
];

function getEnabledLegalPages(lp?: LegalPagesConfig | null): LegalPageEntry[] {
  if (!lp) return [];
  return LEGAL_ORDER
    .map((key) => lp[key])
    .filter((entry): entry is LegalPageEntry => !!entry && entry.enabled);
}

/**
 * Global site footer with three columns:
 *
 *   1. Brand — store name + copyright
 *   2. Navigation — scroll links to page sections (from sectionRegistry)
 *   3. Legal — dynamic links from `legalPages` config
 *
 * Rendered at the very bottom of the storefront layout, below all page
 * content. This is a client component because it reads the section
 * registry via Zustand.
 */
export default function Footer({ branding, legalPages, contactEmail }: FooterProps) {
  const sections = useSectionRegistry((s) => s.sections);
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const legalEntries = getEnabledLegalPages(legalPages);
  const year = new Date().getFullYear();

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <footer className="bg-[var(--color-primary)] text-white/80 pt-12 pb-8">
      <Container>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-16">
          {/* ── Column 1: Brand ── */}
          <div>
            <p className="text-white font-extrabold text-base uppercase tracking-tight">
              {branding.storeName}
            </p>
            {branding.tagline && (
              <p className="mt-2 text-sm leading-relaxed text-white/60 max-w-[260px]">
                {branding.tagline}
              </p>
            )}
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="mt-3 inline-block text-sm text-white/60 hover:text-white transition-colors"
              >
                {contactEmail}
              </a>
            )}
          </div>

          {/* ── Column 2: Section navigation ── */}
          {sortedSections.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">
                Nawigacja
              </h3>
              <ul className="space-y-2.5">
                {sortedSections.slice(0, 8).map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => scrollTo(entry.id)}
                      className="text-sm text-white/70 hover:text-white transition-colors focus:outline-none"
                    >
                      {entry.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Column 3: Legal links ── */}
          {legalEntries.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">
                Informacje
              </h3>
              <ul className="space-y-2.5">
                {legalEntries.map((page) => (
                  <li key={page.slug}>
                    <a
                      href={`/${page.slug}`}
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {page.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>&copy; {year} {branding.storeName}. Wszelkie prawa zastrzeżone.</p>
          <p>Powered by ecommerce-flow.ai</p>
        </div>
      </Container>
    </footer>
  );
}
