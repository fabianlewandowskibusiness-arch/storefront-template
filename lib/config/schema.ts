import { z } from "zod";

const themeSchema = z.object({
  primaryColor: z.string().default("#0f172a"),
  backgroundColor: z.string().default("#ffffff"),
  surfaceColor: z.string().default("#f8fafc"),
  textColor: z.string().default("#111827"),
  mutedTextColor: z.string().default("#6b7280"),
  accentColor: z.string().default("#6366f1"),
  accentSoftColor: z.string().default("#eef2ff"),
  successColor: z.string().default("#16a34a"),
  warningColor: z.string().default("#f59e0b"),
  borderColor: z.string().default("#e5e7eb"),
  radius: z.string().default("xl"),
  shadow: z.string().default("soft"),
  spacing: z.string().default("comfortable"),
  fontPreset: z.string().default("modern"),
});

const brandingSchema = z.object({
  storeName: z.string(),
  productName: z.string(),
  tagline: z.string().default(""),
  language: z.string().default("pl"),
  logoUrl: z.string().default(""),
  faviconUrl: z.string().default(""),
});

const blockSchema = z.object({
  id: z.string(),
  type: z.string(),
  settings: z.record(z.string(), z.unknown()).default({}),
});

const sectionSchema = z.object({
  id: z.string(),
  type: z.enum([
    "ANNOUNCEMENT_BAR",
    "HERO",
    "TRUST_BAR",
    "BENEFITS",
    "PROBLEM",
    "FEATURES",
    "COMPARISON",
    "TESTIMONIALS",
    "OFFER",
    "FAQ",
    "CTA",
    "FOOTER",
  ]),
  position: z.number(),
  settings: z.record(z.string(), z.unknown()).default({}),
  blocks: z.array(blockSchema).default([]),
});

const pageSchema = z.object({
  // z.string() instead of z.enum(["HOME"]) so Zod does not fail when backend
  // sends a multi-page config. resolveHomePage() handles HOME filtering at render time.
  type: z.string(),
  title: z.string(),
  slug: z.string(),
  sections: z.array(sectionSchema).default([]),
});

const commerceSchema = z.object({
  provider: z.string().default("woocommerce"),
  storeUrl: z.string(),
  productUrl: z.string().default(""),
  productId: z.string(),
  variationId: z.string().nullable().optional(),
  checkoutMode: z.string().default("ADD_TO_CART_REDIRECT"),
  ctaButtonLabel: z.string().default("Kup teraz"),
});

const analyticsSchema = z.object({
  provider: z.string().default("custom"),
  enabled: z.boolean().default(true),
});

// SEO block — all fields optional so pre-SEO storefront configs remain valid.
// The backend may send any subset; the metadata layer applies sensible fallbacks.
const seoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().nullable().optional(),
  noIndex: z.boolean().optional(),
});

export const storefrontConfigSchema = z.object({
  theme: themeSchema,
  branding: brandingSchema,
  pages: z.array(pageSchema).min(1),
  commerce: commerceSchema,
  analytics: analyticsSchema.default({ provider: "custom", enabled: true }),
  // Optional — absent in older configs, present in newly-generated ones.
  seo: seoSchema.nullable().optional(),
});
