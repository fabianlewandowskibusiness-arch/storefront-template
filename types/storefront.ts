import type { z } from "zod";
import type { storefrontConfigSchema } from "@/lib/config/schema";

export type StorefrontConfig = z.infer<typeof storefrontConfigSchema>;

export type PageType = string;

export type SectionType =
  | "ANNOUNCEMENT"
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
  | "FOOTER" // Deprecated — chrome Footer is the canonical footer. Kept for config compat.
  // High-conversion DTC redesign — new section types
  | "UGC"
  | "EXPERT"
  | "STORY"
  | "RISK_REVERSAL";

// ── Announcement ticker ────────────────────────────────────────────────────────

/**
 * A single item in the scrolling ANNOUNCEMENT ticker bar.
 * Mirrors {@code AnnouncementItem.java}.
 */
export interface AnnouncementItem {
  text: string;
  icon?: string | null;
  linkUrl?: string | null;
  /** "DEFAULT" | "ACCENT" | "SUCCESS" */
  emphasis?: string | null;
}

export interface AnnouncementSectionSettings {
  items?: AnnouncementItem[];
  /** Scroll speed in pixels/second. Default 40. */
  speed?: number | null;
  pauseOnHover?: boolean | null;
  repeat?: boolean | null;
}

// ── Hero buy-box building blocks ──────────────────────────────────────────────

export interface GalleryItem {
  url: string;
  alt?: string;
  type?: "image" | "video";
}

export interface HeroPackage {
  id: string;
  label: string;          // e.g. "1 sztuka", "2 sztuki + GRATIS"
  quantity?: number;
  price: number;
  comparePrice?: number;
  savings?: string;       // e.g. "Oszczędzasz 90 zł"
  isBestseller?: boolean;
  badge?: string;         // override label for the bestseller ribbon
  ctaLabel?: string;
  ctaHref?: string;       // per-package checkout URL (overrides the global one)
  /** Backend product ID — forwarded to cart handoff for WooCommerce matching. */
  productId?: string;
  /** Backend variation ID — forwarded to cart handoff for WooCommerce matching. */
  variationId?: string;
}

// ── Typed section settings ─────────────────────────────────────────────────────
//
// These interfaces mirror the Java typed section models in
// com.ecommerceflow.storefront.domain.layout.sections.
// They define the expected shape of StorefrontSection.settings for each
// section type, allowing renderers to safely cast from Record<string, unknown>.

// ── Trust signals ─────────────────────────────────────────────────────────────

/**
 * A short trust signal icon + text pair shown near the hero CTA.
 * Mirrors {@code TrustItem.java}.
 */
export interface TrustItem {
  icon?: string | null;
  text?: string | null;
}

// ── Hero social proof block ───────────────────────────────────────────────────

/**
 * Structured social proof summary embedded in the hero buy box (v2).
 * Mirrors {@code HeroSocialProof.java}.
 */
export interface HeroSocialProof {
  averageRating?: number | null;
  reviewCount?: number | null;
  customerCountText?: string | null;
  customerCountNumber?: number | null;
  recommendationLabel?: string | null;
  selectedByCount?: string | null;
  socialCount?: string | null;
  /** Live activity hint, e.g. "12 osób ogląda teraz" */
  viewersNowText?: string | null;
  /** E.g. "28 osób kupiło w ostatnich 24h" */
  purchasedRecentlyText?: string | null;
  /** E.g. "Wysłano dziś: 134 zamówienia" */
  shippedTodayText?: string | null;
}

// ── Sticky buy bar ────────────────────────────────────────────────────────────

/**
 * Settings for the sticky buy bar that appears after scrolling past the hero.
 * Mirrors {@code StickyBuyBarSettings.java}.
 */
export interface StickyBuyBarSettings {
  enabled?: boolean;
  label?: string | null;
  defaultPriceText?: string | null;
  trustText?: string | null;
  /** When true, only shown on mobile. Default false. */
  mobileOnly?: boolean;
  /** Show after hero scrolls out of view. Default true. */
  showAfterHero?: boolean;
  ctaLabelOverride?: string | null;
}

// ── Package option ────────────────────────────────────────────────────────────

export interface PackageOption {
  name: string;
  quantity: number;
  price: number;
  compareAtPrice?: number | null;
  label?: string | null;
  // ── v2 fields ──────────────────────────────────────────────────────────────
  /** Per-package checkout URL that overrides the global commerce.productUrl. */
  ctaHref?: string | null;
  /** Pre-formatted savings copy, e.g. "Oszczędzasz 90 zł". */
  savingsText?: string | null;
  /** Card badge text distinct from label, e.g. "Najlepsza wartość". */
  badge?: string | null;
  /** Supporting subtitle below the package name. */
  subtitle?: string | null;
  /** When true, this package is pre-selected on render. */
  isDefault?: boolean | null;
  /** Editorial stock scarcity hint, e.g. "Ostatnie 12 sztuk". */
  stockHint?: string | null;
  /** Editorial urgency copy, e.g. "Tylko dziś -20%". */
  urgencyHint?: string | null;
}

export interface HeroSectionSettings {
  headline?: string | null;
  subheadline?: string | null;
  description?: string | null;
  bullets?: string[];
  // ── v1 social proof (legacy — prefer socialProof for v2) ──────────────────
  /** @deprecated Use socialProof.averageRating */
  rating?: number | null;
  /** @deprecated Use socialProof.reviewCount */
  reviewCount?: number | null;
  // ── v2 social proof ───────────────────────────────────────────────────────
  socialProof?: HeroSocialProof | null;
  // ── Media ─────────────────────────────────────────────────────────────────
  gallery?: string[];
  videoUrl?: string | null;
  // ── CTAs ──────────────────────────────────────────────────────────────────
  primaryCtaLabel?: string | null;
  secondaryCtaLabel?: string | null;
  // ── Commerce signals ──────────────────────────────────────────────────────
  returnPolicyShort?: string | null;
  shippingBadgeText?: string | null;
  paymentMethods?: string[];
  trustItems?: TrustItem[];
  // ── Legacy trust signals (v1) ─────────────────────────────────────────────
  trustBadge?: string | null;
  deliveryInfo?: string | null;
  paymentInfo?: string | null;
  // ── Package selector ──────────────────────────────────────────────────────
  packages?: PackageOption[];
  selectedPackageLabel?: string | null;
  buyBarSummary?: string | null;
  stickyBuyBar?: StickyBuyBarSettings | null;
}

export interface Testimonial {
  authorName?: string | null;
  authorHandle?: string | null;
  avatarUrl?: string | null;
  rating?: number | null;
  location?: string | null;
  verifiedPurchase?: boolean | null;
  /** Bold card headline, e.g. "Przestałem budzić się w nocy". */
  title?: string | null;
  /** Lifestyle/product-in-use photo URL (not the profile avatar). */
  imageUrl?: string | null;
  /** YouTube embed or mp4 URL — card renders as video card when present. */
  videoUrl?: string | null;
  /** When true, promoted to the top of the carousel. */
  featured?: boolean | null;
  /** E.g. "Po 2 tygodniach" — time-to-result indicator. */
  improvementTimeframe?: string | null;
  /** Which package this customer purchased, e.g. "Zestaw 3-miesięczny". */
  productVariant?: string | null;
  /** Short excerpt for compact carousel cards (≤ 120 chars). */
  quoteShort?: string | null;
  /** Full detailed review text for expanded / featured view. */
  quoteLong?: string | null;
}

// ── UGC item ──────────────────────────────────────────────────────────────────

/**
 * A rich UGC carousel item (v2 format).
 * Mirrors {@code UgcItem.java}.
 */
export interface UgcItem {
  imageUrl?: string | null;
  videoUrl?: string | null;
  authorName?: string | null;
  authorHandle?: string | null;
  caption?: string | null;
  rating?: number | null;
  location?: string | null;
  /** When true, rendered in a featured/highlighted card style. */
  featured?: boolean | null;
  productVariant?: string | null;
}

export interface UgcSectionSettings {
  /** Optional section title. */
  title?: string | null;
  /** Optional section description. */
  description?: string | null;
  /** Rich carousel items — at least 3 recommended. */
  items?: UgcItem[];
}

export interface ExpertSectionSettings {
  title?: string | null;
  description?: string | null;
  videoUrl?: string | null;
  expertName?: string | null;
  expertAvatarUrl?: string | null;
}

export interface ComparisonRow {
  feature?: string | null;
  productValue?: string | null;
  competitorValue?: string | null;
}

export interface ComparisonSectionSettings {
  title?: string | null;
  productColumnLabel?: string | null;
  competitorColumnLabel?: string | null;
  rows?: ComparisonRow[];
}

export interface BenefitItem {
  icon?: string | null;
  title?: string | null;
  description?: string | null;
}

export interface BenefitsSectionSettings {
  title?: string | null;
  subtitle?: string | null;
  items?: BenefitItem[];
}

export interface StorySectionSettings {
  title?: string | null;
  description?: string | null;
  media?: string | null;
  body?: string | null;
}

export interface ProblemItem {
  title?: string | null;
  description?: string | null;
}

export interface ProblemSectionSettings {
  title?: string | null;
  subtitle?: string | null;
  items?: ProblemItem[];
}

export interface RiskReversalSectionSettings {
  title?: string | null;
  description?: string | null;
  badgeUrl?: string | null;
  steps?: string[];
}

export interface TestimonialSectionSettings {
  title?: string | null;
  testimonials?: Testimonial[];
}

export interface FaqItem {
  question?: string | null;
  answer?: string | null;
}

export interface FaqSectionSettings {
  title?: string | null;
  items?: FaqItem[];
}

export interface StorefrontBlock {
  id: string;
  type: string;
  settings: Record<string, unknown> | null;
}

export interface StorefrontSection {
  id: string;
  type: SectionType;
  position: number;
  settings: Record<string, unknown> | null;
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
  fontPreset: string;
}

export interface BrandingConfig {
  storeName: string;
  productName: string;
  tagline: string;
  language: string;
  logoUrl: string;
  faviconUrl: string;
}

export interface CommerceConfig {
  provider: string;
  storeUrl: string | null;
  productUrl: string;
  productId: string | null;
  variationId?: string | null;
  checkoutMode: string;
  ctaButtonLabel: string;
  /** ISO 4217 currency code for price display. Default: "PLN". */
  currency: string;
  /**
   * When the WooCommerce Cart Bridge plugin is configured on the backend,
   * this field contains the handoff endpoint URL. Its presence signals
   * "full bridge mode" — the storefront will POST real cart lines here.
   * Absent / null means URL-only (degraded) mode.
   */
  pluginHandoffUrl?: string | null;
}

export interface AnalyticsConfig {
  provider: string;
  enabled: boolean;
}

export interface SeoConfig {
  title?: string | null;
  description?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  noIndex?: boolean | null;
}

// ── Seller ──────────────────────────────────────────────────────────────────

export interface SellerConfig {
  storeName: string;
  legalCompanyName: string;
  businessAddress: string;
  vatNumber: string;
  contactEmail: string;
  contactPhone: string;
  returnPolicyDays: number;
  shippingCountries: string;
  dataControllerName: string;
  dataControllerAddress: string;
  storeUrl: string;
  additionalNotes: string;
}

// ── Legal pages ─────────────────────────────────────────────────────────────

export interface LegalPageEntry {
  slug: string;
  title: string;
  enabled: boolean;
}

export type LegalPageKey = "returns" | "shipping" | "privacy" | "terms" | "contact";

export interface LegalPagesConfig {
  returns?: LegalPageEntry | null;
  shipping?: LegalPageEntry | null;
  privacy?: LegalPageEntry | null;
  terms?: LegalPageEntry | null;
  contact?: LegalPageEntry | null;
}
