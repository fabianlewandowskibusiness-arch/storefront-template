import type { Metadata } from "next";
import { getStorefrontConfig } from "@/lib/config/getStorefrontConfig";
import { buildThemeVariables } from "@/lib/storefront/buildThemeVariables";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getStorefrontConfig();
  return {
    title: `${config.branding.productName} | ${config.branding.storeName}`,
    description: config.branding.tagline,
    ...(config.branding.faviconUrl
      ? { icons: { icon: config.branding.faviconUrl } }
      : {}),
  };
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
