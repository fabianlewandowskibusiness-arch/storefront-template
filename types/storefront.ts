import type { z } from "zod";
import type { storefrontConfigSchema } from "@/lib/config/schema";

export type StorefrontConfig = z.infer<typeof storefrontConfigSchema>;

export type PageType = string;

export type SectionType =
  | "ANNOUNCEMENT_BAR"
  | "HERO"
  | "TRUST_BAR"
  | "BENEFITS"
  | "PROBLEM"
  | "FEATURES"
  | "COMPARISON"
  | "TESTIMONIALS"
  | "OFFER"
  | "FAQ"
  | "CTA"
  | "FOOTER";

export interface StorefrontBlock {
  id: string;
  type: string;
  settings: Record<string, unknown>;
}

export interface StorefrontSection {
  id: string;
  type: SectionType;
  position: number;
  settings: Record<string, unknown>;
  blocks: StorefrontBlock[];
}

export interface StorefrontPage {
  type: PageType;
  title: string;
  slug: string;
  sections: StorefrontSection[];
}

export interface ThemeConfig {
  primaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  accentColor: string;
  accentSoftColor: string;
  successColor: string;
  warningColor: string;
  borderColor: string;
  radius: string;
  shadow: string;
  spacing: string;
}

export interface BrandingConfig {
  storeName: string;
  productName: string;
  tagline: string;
  language: string;
}

export interface CommerceConfig {
  provider: string;
  storeUrl: string;
  productUrl: string;
  productId: string;
  variationId?: string | null;
  checkoutMode: string;
  ctaButtonLabel: string;
}

export interface AnalyticsConfig {
  provider: string;
  enabled: boolean;
}
