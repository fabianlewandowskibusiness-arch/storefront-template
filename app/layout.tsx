import type { Metadata } from "next";
import "./globals.css";
import { getStorefrontConfig } from "@/lib/config/getStorefrontConfig";
import { buildThemeVariables } from "@/lib/storefront/buildThemeVariables";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getStorefrontConfig();
  return {
    title: `${config.branding.productName} | ${config.branding.storeName}`,
    description: config.branding.tagline,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getStorefrontConfig();
  const themeVars = buildThemeVariables(config.theme);

  return (
    <html lang={config.branding.language}>
      <body style={themeVars as React.CSSProperties}>
        {children}
      </body>
    </html>
  );
}
