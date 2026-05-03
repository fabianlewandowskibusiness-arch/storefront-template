import type { Metadata } from "next";
import { getStorefrontConfig } from "@/lib/config/getStorefrontConfig";
import { buildThemeVariables } from "@/lib/storefront/buildThemeVariables";
import { createCommerceProvider } from "@/lib/commerce/provider";
import StorefrontChrome, { Footer } from "@/components/chrome/StorefrontChrome";
import type { StorefrontConfig } from "@/types/storefront";
import { deriveExpertAnnouncementCta } from "@/lib/storefront/expertCta";

/**
 * Pull announcement ticker items out of the first ANNOUNCEMENT section,
 * if one exists. The announcement used to render inline via renderSection;
 * it now lives in chrome above the sticky header, so the layout extracts
 * the items here and the renderer skips ANNOUNCEMENT entirely.
 *
 * After extraction, any item matching the "👉 … opini…" pattern is replaced
 * with a CTA derived from the Expert section data via deriveExpertAnnouncementCta.
 * This corrects AI-generated text that may not match the actual specialist
 * type configured for this storefront.
 */
function extractAnnouncementItems(config: StorefrontConfig): string[] {
  const home = config.pages.find((p) => p.type === "HOME") ?? config.pages[0];
  if (!home) return [];
  const ann = home.sections.find((s) => s.type === "ANNOUNCEMENT");
  if (!ann) return [];
  const raw = ann.data?.items;
  if (!Array.isArray(raw)) return [];
  const items = raw
    .map((i: unknown) =>
      typeof i === "object" && i && "text" in i
        ? String((i as { text?: string }).text ?? "")
        : "",
    )
    .filter(Boolean);

  // Replace any item that looks like an expert CTA with the derived version.
  // deriveExpertAnnouncementCta returns null when no Expert section exists
  // (→ items pass through unchanged) and a string otherwise (→ matching items replaced).
  const expertCta = deriveExpertAnnouncementCta(home.sections);
  if (!expertCta) return items;

  // Broad multi-keyword detector — tolerates the historical data shape where
  // the 👉 emoji lived in a now-deprecated AnnouncementItem.icon field and
  // was stripped by the contract enforcer, leaving plain text with no emoji.
  //
  // Patterns covered:
  //   opini[aeę]   — "opinia", "opinie", "opinię"  (any flex form of "opinia")
  //   \bekspert    — "eksperta", "ekspertów", …
  //   fizjoterap   — "fizjoterapeuty", "fizjoterapeutka", …
  //   \bspecjalist — "specjalisty", "specjalistka", …
  //   \brekomend   — "rekomendacja", "rekomenduje", …
  //
  // The 👉 … opini pattern is retained as one of the branches so existing
  // items that do carry the emoji are still matched without a regex change.
  function looksLikeExpertCta(text: string): boolean {
    return (
      /👉.*opini/i.test(text) ||
      /opini[aeę]/i.test(text) ||
      /\bekspert/i.test(text) ||
      /fizjoterap/i.test(text) ||
      /\bspecjalist/i.test(text) ||
      /\brekomend/i.test(text)
    );
  }

  return items.map((text) => (looksLikeExpertCta(text) ? expertCta : text));
}

/**
 * Locate the hero image from the first HERO section on the HOME page.
 * Used as the default OG image when `seo.ogImage` is not provided.
 */
function findHeroImage(config: StorefrontConfig): string | undefined {
  const home = config.pages.find((p) => p.type === "HOME") ?? config.pages[0];
  if (!home) return undefined;
  const hero = home.sections.find((s) => s.type === "HERO");
  const gallery = hero?.data?.gallery;
  if (Array.isArray(gallery) && gallery.length > 0) {
    const first = gallery[0];
    if (typeof first === "string" && first.length > 0) return first;
  }
  const image = hero?.data?.image;
  return typeof image === "string" && image.length > 0 ? image : undefined;
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getStorefrontConfig();
  const { branding, seo } = config;

  // Resolved title: seo.title → "{productName} | {storeName}"
  const title = seo?.title || `${branding.productName} | ${branding.storeName}`;

  // Resolved description: seo.description → branding.tagline (may be empty string)
  const description = seo?.description || branding.tagline || undefined;

  // OG title / description fall back to the resolved metadata title / description.
  const ogTitle = seo?.ogTitle || title;
  const ogDescription = seo?.ogDescription || description;

  // OG image: explicit seo.ogImage → HERO section image → undefined.
  const ogImage = seo?.ogImage || findHeroImage(config);

  const metadata: Metadata = {
    title,
    description,
    openGraph: {
      title: ogTitle,
      ...(ogDescription ? { description: ogDescription } : {}),
      ...(ogImage ? { images: [ogImage] } : {}),
      type: "website",
    },
    ...(branding.faviconUrl
      ? { icons: { icon: branding.faviconUrl } }
      : {}),
    ...(seo?.noIndex
      ? { robots: { index: false, follow: false } }
      : {}),
  };

  return metadata;
}

export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getStorefrontConfig();
  const themeVars = buildThemeVariables(config.theme);

  const announcementItems = extractAnnouncementItems(config);
  const commerce = createCommerceProvider(config.commerce);
  const checkoutUrl = commerce?.getCheckoutUrl() ?? "#offer";

  // storeId: in host-based (multi-tenant) mode this comes from config.storeId,
  // which the backend populates from the project's pipelineSessionId.
  // In legacy (STORE_ID env) mode it also comes from config.storeId (undefined)
  // so we fall back to STORE_ID. In local dev both are undefined — checkout is
  // disabled in that case (useCheckout shows a dev warning).
  const storeId = config.storeId ?? process.env.STORE_ID;
  const apiUrl = process.env.STOREFRONT_API_URL ?? "";

  return (
    <div lang={config.branding.language} style={themeVars as React.CSSProperties}>
      <StorefrontChrome
        branding={config.branding}
        announcementItems={announcementItems}
        checkoutUrl={checkoutUrl}
        storeId={storeId}
        apiUrl={apiUrl}
        pluginHandoffUrl={config.commerce?.pluginHandoffUrl}
        legalPages={config.legalPages}
        contactEmail={config.seller?.contactEmail}
      />
      {children}
      <Footer
        branding={config.branding}
        legalPages={config.legalPages}
        contactEmail={config.seller?.contactEmail}
      />
    </div>
  );
}
