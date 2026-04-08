import type { Metadata } from "next";
import { getStorefrontConfig } from "@/lib/config/getStorefrontConfig";
import { buildThemeVariables } from "@/lib/storefront/buildThemeVariables";
import type { StorefrontConfig } from "@/types/storefront";

/**
 * Locate the hero image from the first HERO section on the HOME page.
 * Used as the default OG image when `seo.ogImage` is not provided.
 */
function findHeroImage(config: StorefrontConfig): string | undefined {
  const home = config.pages.find((p) => p.type === "HOME") ?? config.pages[0];
  if (!home) return undefined;
  const hero = home.sections.find((s) => s.type === "HERO");
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

  return (
    <div lang={config.branding.language} style={themeVars as React.CSSProperties}>
      {children}
    </div>
  );
}
