import type { Metadata } from "next";
import { getStorefrontConfig } from "@/lib/config/getStorefrontConfig";
import { buildThemeVariables } from "@/lib/storefront/buildThemeVariables";
import { createCommerceProvider } from "@/lib/commerce/provider";
import StorefrontChrome from "@/components/chrome/StorefrontChrome";
import type { StorefrontConfig } from "@/types/storefront";

/**
 * Pull announcement ticker items out of the first ANNOUNCEMENT section,
 * if one exists. The announcement used to render inline via renderSection;
 * it now lives in chrome above the sticky header, so the layout extracts
 * the items here and the renderer skips ANNOUNCEMENT entirely.
 */
function extractAnnouncementItems(config: StorefrontConfig): string[] {
  const home = config.pages.find((p) => p.type === "HOME") ?? config.pages[0];
  if (!home) return [];
  const ann = home.sections.find((s) => s.type === "ANNOUNCEMENT");
  if (!ann) return [];
  const raw = ann.settings?.items;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((i: unknown) =>
      typeof i === "object" && i && "text" in i
        ? String((i as { text?: string }).text ?? "")
        : "",
    )
    .filter(Boolean);
}

/**
 * Locate the hero image from the first HERO section on the HOME page.
 * Used as the default OG image when `seo.ogImage` is not provided.
 */
function findHeroImage(config: StorefrontConfig): string | undefined {
  const home = config.pages.find((p) => p.type === "HOME") ?? config.pages[0];
  if (!home) return undefined;
  const hero = home.sections.find((s) => s.type === "HERO");
  const gallery = hero?.settings?.gallery;
  if (Array.isArray(gallery) && gallery.length > 0) {
    const first = gallery[0];
    if (typeof first === "string" && first.length > 0) return first;
  }
  const image = hero?.settings?.image;
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

  // Available server-side only — not exposed to the client bundle.
  const storeId = process.env.STORE_ID;
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
      />
      {children}
    </div>
  );
}
