import { getStorefrontConfig } from "@/lib/config/getStorefrontConfig";
import { resolveHomePage } from "@/lib/storefront/resolveHomePage";
import { renderSection } from "@/lib/storefront/renderSection";
import { createCommerceProvider } from "@/lib/commerce/provider";
import AnalyticsInit from "@/components/AnalyticsInit";
import RegisterSections from "@/components/chrome/RegisterSections";
import type {
  StorefrontPage,
  StorefrontSection,
  SectionType,
} from "@/types/storefront";
import type { SectionEntry } from "@/lib/stores/sectionRegistry";

/**
 * Finds the first HERO section's primary image URL from `settings.gallery[0]`.
 * Used as the default product anchor for sections like COMPARISON that benefit
 * from a visual product reference.
 */
function findHeroImage(page: StorefrontPage): string | undefined {
  const hero = page.sections.find((s) => s.type === "HERO");
  if (!hero) return undefined;
  const gallery = hero.data?.gallery;
  if (Array.isArray(gallery) && gallery.length > 0) {
    const first = gallery[0];
    return typeof first === "string" && first.length > 0 ? first : undefined;
  }
  return undefined;
}

// ── Navigation label + visibility ─────────────────────────────────────────────
//
// Not every section is a navigation destination. The announcement ticker,
// trust bar, and footer are not places a visitor would want to jump to.
// For the remaining section types we try `settings.title` (or `headline`)
// first and fall back to a per-type label.

const NON_NAVIGABLE: ReadonlySet<SectionType> = new Set([
  "ANNOUNCEMENT",
  "TRUST_BAR",
  "FOOTER",
]);

const TYPE_LABELS: Record<SectionType, string> = {
  ANNOUNCEMENT: "",
  HERO: "Produkt",
  TRUST_BAR: "",
  BENEFITS: "Korzyści",
  PROBLEM: "Problem",
  FEATURES: "Funkcje",
  COMPARISON: "Porównanie",
  TESTIMONIALS: "Opinie",
  OFFER: "Zamów",
  FAQ: "FAQ",
  CTA: "Zamów",
  FOOTER: "",
  UGC: "Klienci",
  EXPERT: "Eksperci",
  STORY: "Nasza historia",
  RISK_REVERSAL: "Gwarancja",
};

function resolveSectionLabel(section: StorefrontSection): string {
  const data = section.data ?? {};
  const title = (data.title as string | undefined)?.trim();
  if (title) return title;
  const headline = (data.headline as string | undefined)?.trim();
  if (headline) return headline;
  return TYPE_LABELS[section.type] || "";
}

function sectionAnchorId(section: StorefrontSection): string {
  return `section-${section.id}`;
}

export default async function HomePage() {
  const config = await getStorefrontConfig();
  const home = resolveHomePage(config);
  const commerce = createCommerceProvider(config.commerce);
  const checkoutUrl = commerce?.getCheckoutUrl() ?? "#offer";

  const sortedSections = [...home.sections].sort((a, b) => a.position - b.position);

  // Build the navigable-section list once, server-side. This is passed to
  // RegisterSections which pushes it into the client-side registry on mount.
  // The `type` field is kept so desktop HeaderNavLinks can look up the
  // HERO / TESTIMONIALS / COMPARISON / FAQ slots by type instead of id.
  const navigableSections: SectionEntry[] = sortedSections
    .filter((s) => !NON_NAVIGABLE.has(s.type))
    .map((s, i) => {
      const label = resolveSectionLabel(s);
      return label
        ? { id: sectionAnchorId(s), label, order: i, type: s.type }
        : null;
    })
    .filter((entry): entry is SectionEntry => entry !== null);

  const ctx = {
    branding: config.branding,
    commerce: config.commerce,
    checkoutUrl,
    // Currency from the commerce config. Falls back to PLN when commerce
    // is not configured (null) or the field was absent in older configs.
    currency: config.commerce?.currency ?? "PLN",
    heroImage: findHeroImage(home),
  };

  return (
    <>
      <AnalyticsInit enabled={config.analytics.enabled} />
      <RegisterSections sections={navigableSections} />
      <main>
        {sortedSections.map((section) => {
          const rendered = renderSection(section, ctx);
          if (!rendered) return null;
          // Every rendered section is wrapped in a scroll-anchor div with
          // an id, so the navigation drawer can smooth-scroll to it with
          // the sticky-header offset baked into `.scroll-anchor`.
          return (
            <div key={section.id} id={sectionAnchorId(section)} className="scroll-anchor">
              {rendered}
            </div>
          );
        })}
      </main>
    </>
  );
}
