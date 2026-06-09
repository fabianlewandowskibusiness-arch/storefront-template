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
 * Global site footer — intentionally compact and premium.
 *
 *   1. Brand — store name, short description (tagline), contact email
 *   2. "Informacje" — dynamic legal/info links from `legalPages` config
 *
 * Section navigation is NOT duplicated here: the header nav and the mobile
 * NavigationDrawer already provide section anchors from the same section
 * registry, so the footer stays clean instead of reading like a generated
 * sitemap. When there are no legal/info links the second column is omitted,
 * leaving just the brand block (no empty columns).
 *
 * Pure presentational component — no client state, so it can render on the server.
 */
export default function Footer({ branding, legalPages, contactEmail }: FooterProps) {
  const legalEntries = getEnabledLegalPages(legalPages);
  const year = new Date().getFullYear();
  const hasInfo = legalEntries.length > 0;

  return (
    <footer className="bg-[var(--color-primary)] text-white/80 pt-12 pb-8">
      <Container>
        <div
          className={`grid grid-cols-1 gap-10 ${hasInfo ? "sm:grid-cols-2 sm:gap-16" : ""}`}
        >
          {/* ── Brand ── */}
          <div>
            <p className="text-white font-extrabold text-base uppercase tracking-tight">
              {branding.storeName}
            </p>
            {branding.tagline && (
              <p className="mt-2 text-sm leading-relaxed text-white/60 max-w-[320px]">
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

          {/* ── Informacje (legal / info links) — omitted entirely when empty ── */}
          {hasInfo && (
            <div className="sm:justify-self-end">
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
