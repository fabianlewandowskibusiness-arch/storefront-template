import { z } from "zod";

// ── Theme ─────────────────────────────────────────────────────────────────────
//
// All theme tokens use z.string().catch(default) — NOT z.string().default(default).
//
// The critical difference:
//   .default(x) → fills in only when the value is ABSENT (undefined key in JSON)
//   .catch(x)   → fills in when the value is absent OR null OR any other invalid type
//
// AI-generated configs routinely emit null for non-critical fields they cannot
// determine. Theme tokens are purely visual; a null token is safely replaced by
// the hardcoded default without crashing the storefront.

const themeSchema = z.object({
  primaryColor:    z.string().catch("#0f172a"),
  backgroundColor: z.string().catch("#ffffff"),
  surfaceColor:    z.string().catch("#f8fafc"),
  textColor:       z.string().catch("#111827"),
  mutedTextColor:  z.string().catch("#6b7280"),
  accentColor:     z.string().catch("#6366f1"),
  accentSoftColor: z.string().catch("#eef2ff"),
  successColor:    z.string().catch("#16a34a"),
  warningColor:    z.string().catch("#f59e0b"),
  borderColor:     z.string().catch("#e5e7eb"),
  radius:          z.string().catch("xl"),
  shadow:          z.string().catch("soft"),
  spacing:         z.string().catch("comfortable"),
  fontPreset:      z.string().catch("modern"),
});

// ── Branding ──────────────────────────────────────────────────────────────────

const brandingSchema = z.object({
  // Required structural fields — the storefront cannot meaningfully render
  // without a store name and product name.  Intentionally left strict so that
  // a truly broken config (missing these) is caught rather than silently
  // rendering with empty values.
  storeName:   z.string(),
  productName: z.string(),

  // Content / display fields: AI may omit or emit null — coerce to safe defaults.
  tagline:    z.string().catch(""),
  language:   z.string().catch("pl"),
  logoUrl:    z.string().catch(""),
  faviconUrl: z.string().catch(""),
});

// ── Sections & pages ──────────────────────────────────────────────────────────

const blockSchema = z.object({
  id:   z.string(),
  type: z.string(),
  settings: z.record(z.string(), z.unknown()).nullable().default({}),
});

const sectionSchema = z.object({
  // id and type remain strict — they are structural identifiers.
  // An unknown section type is a real error (renderSection cannot handle it).
  id:   z.string(),
  type: z.enum([
    "ANNOUNCEMENT",
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
    "UGC",
    "EXPERT",
    "STORY",
    "RISK_REVERSAL",
  ]),
  // position: AI may omit or send null — recover to 0 so sort still works
  // and other sections render in a reasonable order.
  position: z.number().catch(0),
  settings: z.record(z.string(), z.unknown()).nullable().default({}),
  blocks:   z.array(blockSchema).default([]),
});

const pageSchema = z.object({
  // z.string() instead of z.enum(["HOME"]) — resolveHomePage() handles HOME
  // filtering at render time so multi-page configs do not fail validation.
  // .catch("UNKNOWN") tolerates a null page type without failing the whole
  // config: a page with type "UNKNOWN" simply won't match HOME lookup.
  type:  z.string().catch("UNKNOWN"),
  // title and slug are display / routing values — safe to default on null.
  title: z.string().catch(""),
  slug:  z.string().catch("/"),
  sections: z.array(sectionSchema).default([]),
});

// ── Commerce ──────────────────────────────────────────────────────────────────
//
// provider, productUrl, checkoutMode, ctaButtonLabel use .catch() — they are
// always needed as strings by the rendering / commerce layer and should never
// be null at runtime.
//
// storeUrl and productId remain nullable: null legitimately signals that
// commerce has not been configured yet.  The woocommerce provider handles
// null via ?? "" fallback at runtime.

const commerceSchema = z.object({
  provider:       z.string().catch("woocommerce"),
  storeUrl:       z.string().nullable().default(""),
  productUrl:     z.string().catch(""),
  productId:      z.string().nullable().default(""),
  variationId:    z.string().nullable().optional(),
  checkoutMode:   z.string().catch("ADD_TO_CART_REDIRECT"),
  ctaButtonLabel: z.string().catch("Kup teraz"),
  // Currency code for price display. Backend sends the project's configured
  // currency; older configs that lack it fall back to PLN.
  currency:       z.string().catch("PLN"),
  // When the WooCommerce Cart Bridge plugin is configured, the backend
  // populates this with the handoff endpoint URL. Its presence signals
  // "full bridge mode" to the storefront checkout flow. Absent / null
  // means URL-only (degraded) mode.
  pluginHandoffUrl: z.string().nullable().optional(),
});

// ── Analytics ─────────────────────────────────────────────────────────────────
//
// The backend runtime DTO does not include an analytics field — it is always
// absent from the API response.  The outer .catch() on the top-level field
// handles: absent (undefined), null, and any other unexpected value.
// Inner .catch() values apply when analytics IS present but contains null fields.

const analyticsSchema = z.object({
  provider: z.string().catch("custom"),
  enabled:  z.boolean().catch(true),
});

// ── SEO ───────────────────────────────────────────────────────────────────────
//
// All text fields are .nullish() so Zod accepts both absent and null values.
// The rendering layer (layout.tsx) uses || fallbacks which treat null and
// undefined identically, so no separate null guard is needed there.

const seoSchema = z.object({
  title:         z.string().nullish(),
  description:   z.string().nullish(),
  ogTitle:       z.string().nullish(),
  ogDescription: z.string().nullish(),
  ogImage:       z.string().nullable().optional(),
  noIndex:       z.boolean().nullish(),
});

// ── Top-level config ──────────────────────────────────────────────────────────

export const storefrontConfigSchema = z.object({
  theme:    themeSchema,
  branding: brandingSchema,
  // pages must have at least one entry — a config with no pages is structurally
  // broken and should fail validation so the error surface is visible.
  pages:    z.array(pageSchema).min(1),
  // commerce: null when the project has not yet configured WooCommerce.
  commerce: commerceSchema.nullable().optional(),
  // analytics: absent in the runtime API response — .catch() provides the safe
  // default for absent, null, or malformed values.
  analytics: analyticsSchema.catch({ provider: "custom", enabled: true }),
  // seo: absent in older configs generated before SEO support was introduced.
  seo: seoSchema.nullable().optional(),
});
