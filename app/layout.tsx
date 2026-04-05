import type { Metadata } from "next";
import "./globals.css";
import { getStorefrontConfig } from "@/lib/config/getStorefrontConfig";
import { buildThemeVariables } from "@/lib/storefront/buildThemeVariables";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getStorefrontConfig();
  return {
    title: `${config.brand.productName} | ${config.brand.brandName}`,
    description: config.hero.subheadline || config.brand.tagline,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getStorefrontConfig();
  const themeVars = buildThemeVariables(config);

  return (
    <html lang={config.brand.language}>
      <body style={themeVars as React.CSSProperties}>
        {children}
      </body>
    </html>
  );
}
