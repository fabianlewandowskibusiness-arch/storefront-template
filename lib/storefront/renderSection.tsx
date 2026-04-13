import type {
  StorefrontSection,
  BrandingConfig,
  CommerceConfig,
  GalleryItem,
  HeroPackage,
} from "@/types/storefront";
import type { ShellOverride } from "@/components/layout/SectionShell";
import HeroSection from "@/components/sections/HeroSection";
import TrustBarSection from "@/components/sections/TrustBarSection";
import BenefitsSection from "@/components/sections/BenefitsSection";
import ProblemSection from "@/components/sections/ProblemSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import ComparisonSection from "@/components/sections/ComparisonSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import OfferSection from "@/components/sections/OfferSection";
import FaqSection from "@/components/sections/FaqSection";
import FinalCtaSection from "@/components/sections/FinalCtaSection";
// FooterSection import removed — footer is now chrome-level (components/chrome/Footer.tsx).
// The FOOTER case returns null; the import is no longer needed.
import UgcSection from "@/components/sections/UgcSection";
import ExpertSection from "@/components/sections/ExpertSection";
import StorySection from "@/components/sections/StorySection";
import RiskReversalSection from "@/components/sections/RiskReversalSection";

interface RenderContext {
  branding: BrandingConfig;
  commerce: CommerceConfig | null | undefined;
  checkoutUrl: string;
  currency: string;
  /** First HERO gallery image — used as the default product image for
   *  sections that need product anchoring (e.g. COMPARISON). */
  heroImage?: string;
}

// ── Settings helpers ──────────────────────────────────────────────────────────
//
// All section content is in `settings`. The `blocks` field is part of the API
// contract but is not read by the renderer — `settings` is the single source
// of truth for all section content.

function s(settings: Record<string, unknown> | null, key: string): string {
  return (settings?.[key] as string) ?? "";
}

function sNum(settings: Record<string, unknown> | null, key: string): number {
  const v = settings?.[key];
  return typeof v === "number" ? v : 0;
}

function sBool(settings: Record<string, unknown> | null, key: string): boolean {
  return Boolean(settings?.[key]);
}

function arr<T>(settings: Record<string, unknown> | null, key: string): T[] {
  const v = settings?.[key];
  return Array.isArray(v) ? (v as T[]) : [];
}

// ── Shell override extraction ──────────────────────────────────────────────────

function extractShellOverride(
  settings: Record<string, unknown> | null,
): ShellOverride | undefined {
  if (!settings) return undefined;
  const bg = settings._backgroundStyle as ShellOverride["backgroundStyle"] | undefined;
  const pt = settings._paddingTop as ShellOverride["paddingTop"] | undefined;
  const pb = settings._paddingBottom as ShellOverride["paddingBottom"] | undefined;
  if (!bg && !pt && !pb) return undefined;
  return { backgroundStyle: bg, paddingTop: pt, paddingBottom: pb };
}

// ── Main renderer ─────────────────────────────────────────────────────────────

export function renderSection(section: StorefrontSection, ctx: RenderContext) {
  const settings = section.settings ?? {};

  // Visibility flag — skip hidden sections entirely.
  if (settings._visible === false) return null;

  const shellOverride = extractShellOverride(settings);
  const sectionVariant = (settings._sectionVariant as string) || "";

  switch (section.type) {
    // ── ANNOUNCEMENT ────────────────────────────────────────────────────────
    // The announcement ticker is now rendered as chrome (above the sticky
    // header) rather than in the page flow. The layout reads the items and
    // passes them to StorefrontChrome. The renderer simply skips it so we
    // don't double-render.
    case "ANNOUNCEMENT":
      return null;

    // ── HERO ─────────────────────────────────────────────────────────────────
    // Canonical settings:
    //   gallery: string[]                     — ordered product image URLs
    //   packages: PackageOption[]             — { name, quantity, price, compareAtPrice, label, isDefault, savingsText, badge, ctaHref, ... }
    //   bullets: string[]                     — short ≤5-word benefit phrases
    //   socialProof: { averageRating?, reviewCount?, customerCountText?, ... }
    //   primaryCtaLabel, secondaryCtaLabel
    //   trustBadge, deliveryInfo, paymentInfo — legacy display hints (optional)
    //   stickyBuyBar: StickyBuyBarSettings
    case "HERO": {
      // Gallery: string[] → GalleryItem[]
      const gallery: GalleryItem[] = arr<string>(settings, "gallery").map(
        (url) => ({ url, alt: ctx.branding.productName, type: "image" as const }),
      );

      // Packages: PackageOption[] → HeroPackage[]
      type PkgOpt = {
        name?: string;
        quantity?: number;
        price?: number;
        compareAtPrice?: number;
        label?: string;
        savingsText?: string;
        badge?: string;
        ctaHref?: string;
        productId?: string;
        variationId?: string;
      };
      const packages: HeroPackage[] = arr<PkgOpt>(settings, "packages").map(
        (pkg, i) => ({
          id: `pkg-${i}`,
          label: pkg.name ?? "",
          quantity: pkg.quantity || undefined,
          price: pkg.price ?? 0,
          comparePrice: pkg.compareAtPrice || undefined,
          savings: pkg.savingsText || undefined,
          isBestseller: pkg.label === "BESTSELLER",
          badge: pkg.badge || pkg.label || undefined,
          ctaHref: pkg.ctaHref || undefined,
          // Backend product/variation IDs — forwarded all the way to the
          // cart state so the handoff endpoint can match WooCommerce items.
          productId: pkg.productId || ctx.commerce?.productId || undefined,
          variationId: pkg.variationId || ctx.commerce?.variationId || undefined,
        }),
      );

      const bullets = arr<string>(settings, "bullets");

      // Social proof — canonical: settings.socialProof object
      type SocialProof = { averageRating?: number; reviewCount?: number };
      const sp = settings.socialProof as SocialProof | undefined;

      return (
        <HeroSection
          key={section.id}
          headline={s(settings, "headline")}
          subheadline={s(settings, "subheadline") || undefined}
          description={s(settings, "description") || undefined}
          rating={sp?.averageRating || undefined}
          reviewCount={sp?.reviewCount || undefined}
          bullets={bullets}
          trustBadge={s(settings, "trustBadge") || undefined}
          riskReversal={s(settings, "riskReversal") || undefined}
          deliveryInfo={s(settings, "deliveryInfo") || undefined}
          paymentInfo={s(settings, "paymentInfo") || undefined}
          gallery={gallery}
          packages={packages}
          fallbackCheckoutUrl={ctx.checkoutUrl}
          fallbackCtaLabel={
            s(settings, "primaryCtaLabel") ||
            ctx.commerce?.ctaButtonLabel ||
            "Kup teraz"
          }
          currency={ctx.currency}
          productName={ctx.branding.productName}
        />
      );
    }

    // ── TRUST_BAR ────────────────────────────────────────────────────────────
    // Canonical: settings.items — string[]
    case "TRUST_BAR":
      return (
        <TrustBarSection
          key={section.id}
          items={arr<string>(settings, "items")}
        />
      );

    // ── BENEFITS ─────────────────────────────────────────────────────────────
    // Canonical: settings.title, settings.items — BenefitItem[]
    case "BENEFITS":
      return (
        <BenefitsSection
          key={section.id}
          title={s(settings, "title")}
          sectionVariant={sectionVariant}
          shellOverride={shellOverride}
          items={
            arr<{ title: string; description: string }>(settings, "items")
          }
        />
      );

    // ── PROBLEM ──────────────────────────────────────────────────────────────
    // Canonical: settings.title, settings.description, settings.items — ProblemItem[]
    case "PROBLEM":
      return (
        <ProblemSection
          key={section.id}
          title={s(settings, "title")}
          description={s(settings, "description") || undefined}
          items={arr<{ title: string; description: string }>(settings, "items")}
          shellOverride={shellOverride}
        />
      );

    // ── FEATURES ─────────────────────────────────────────────────────────────
    // Canonical: settings.title, settings.items — { name, description }[]
    case "FEATURES":
      return (
        <FeaturesSection
          key={section.id}
          title={s(settings, "title")}
          shellOverride={shellOverride}
          items={arr<{ name: string; description: string }>(settings, "items")}
        />
      );

    // ── COMPARISON ───────────────────────────────────────────────────────────
    // Canonical: settings.title, settings.subtitle,
    //            settings.rows — { feature, productValue, competitorValue }[]
    // renderSection maps backend field names → component prop names
    case "COMPARISON": {
      type CompRow = {
        feature?: string;
        productValue?: string;
        competitorValue?: string;
      };
      const rows = arr<CompRow>(settings, "rows").map((r) => ({
        label: r.feature ?? "",
        ours: r.productValue ?? "",
        other: r.competitorValue ?? "",
      }));
      return (
        <ComparisonSection
          key={section.id}
          title={s(settings, "title")}
          subtitle={s(settings, "subtitle") || undefined}
          brandName={ctx.branding.productName}
          productImage={ctx.heroImage}
          shellOverride={shellOverride}
          rows={rows}
        />
      );
    }

    // ── TESTIMONIALS ─────────────────────────────────────────────────────────
    // Canonical: settings.title, settings.testimonials — Testimonial[]
    // renderSection maps Testimonial fields → component prop names
    case "TESTIMONIALS": {
      type TestItem = {
        authorName?: string;
        avatarUrl?: string;
        quoteShort?: string;
        quoteLong?: string;
        rating?: number;
        location?: string;
      };
      const items = arr<TestItem>(settings, "testimonials").map((t) => ({
        name: t.authorName ?? "",
        quote: t.quoteShort || t.quoteLong || "",
        avatar: t.avatarUrl || undefined,
        rating: t.rating || undefined,
        location: t.location || undefined,
      }));
      return (
        <TestimonialsSection
          key={section.id}
          title={s(settings, "title")}
          shellOverride={shellOverride}
          items={items}
        />
      );
    }

    // ── OFFER ────────────────────────────────────────────────────────────────
    // Canonical: settings.title, settings.price, settings.compareAtPrice,
    //            settings.included — string[], settings.guaranteeText, etc.
    case "OFFER":
      return (
        <OfferSection
          key={section.id}
          title={s(settings, "title")}
          priceLabel={s(settings, "priceLabel")}
          price={sNum(settings, "price")}
          compareAtPrice={sNum(settings, "compareAtPrice") || undefined}
          currency={s(settings, "currency") || ctx.currency}
          ctaLabel={s(settings, "ctaLabel") || ctx.commerce?.ctaButtonLabel || ""}
          checkoutUrl={ctx.checkoutUrl}
          anchorId={s(settings, "anchorId") || "offer"}
          guaranteeText={s(settings, "guaranteeText")}
          shellOverride={shellOverride}
          included={arr<string>(settings, "included")}
        />
      );

    // ── FAQ ──────────────────────────────────────────────────────────────────
    // Canonical: settings.title, settings.items — { question, answer }[]
    case "FAQ":
      return (
        <FaqSection
          key={section.id}
          title={s(settings, "title")}
          shellOverride={shellOverride}
          items={arr<{ question: string; answer: string }>(settings, "items")}
        />
      );

    // ── CTA ──────────────────────────────────────────────────────────────────
    // Canonical: settings.headline, settings.subheadline, settings.buttonLabel,
    //            settings.trustItems — string[]
    case "CTA":
      return (
        <FinalCtaSection
          key={section.id}
          headline={s(settings, "headline")}
          subheadline={s(settings, "subheadline") || undefined}
          buttonLabel={
            s(settings, "buttonLabel") || ctx.commerce?.ctaButtonLabel || "Kup teraz"
          }
          checkoutUrl={ctx.checkoutUrl}
          trustItems={arr<string>(settings, "trustItems")}
          shellOverride={shellOverride}
        />
      );

    // ── FOOTER (deprecated — chrome Footer is the canonical footer) ────────
    //
    // The footer is now rendered by the chrome-level <Footer /> component in
    // the storefront layout (components/chrome/Footer.tsx). It uses branding,
    // sectionRegistry, and legalPages — not this section's settings.
    //
    // Old configs may still include a FOOTER section. We keep the enum value
    // in the schema so those configs parse without error, but the renderer
    // returns null so no duplicate footer ever appears on the page.
    case "FOOTER":
      return null;

    // ── UGC ──────────────────────────────────────────────────────────────────
    // Canonical: settings.title, settings.description,
    //            settings.items — UgcItem[]
    case "UGC": {
      type UgcItm = {
        imageUrl?: string;
        videoUrl?: string;
        authorName?: string;
        caption?: string;
        rating?: number;
        location?: string;
      };
      const reviews = arr<UgcItm>(settings, "items")
        .map((item, i) => ({
          id: `ugc-${i}`,
          media: {
            url: item.videoUrl || item.imageUrl || "",
            type: (item.videoUrl ? "video" : "image") as "image" | "video",
            alt: item.authorName || undefined,
          },
          quote: item.caption || "",
          name: item.authorName || "",
          location: item.location || undefined,
          rating: item.rating || undefined,
        }))
        .filter((r) => !!r.media.url && !!r.quote);
      return (
        <UgcSection
          key={section.id}
          title={s(settings, "title")}
          description={s(settings, "description") || undefined}
          reviews={reviews}
        />
      );
    }

    // ── EXPERT ───────────────────────────────────────────────────────────────
    // Canonical: all fields in settings (no blocks ever used)
    case "EXPERT":
      return (
        <ExpertSection
          key={section.id}
          title={s(settings, "title")}
          description={s(settings, "description")}
          expertName={s(settings, "expertName")}
          expertRole={s(settings, "expertRole") || undefined}
          expertImage={s(settings, "expertImage") || undefined}
          videoUrl={s(settings, "videoUrl") || undefined}
          quote={s(settings, "quote") || undefined}
        />
      );

    // ── STORY ────────────────────────────────────────────────────────────────
    // Canonical: settings.title, settings.description (intro),
    //            settings.media (image URL),
    //            settings.paragraphs — { heading?, body }[]
    case "STORY": {
      type StoryPara = { heading?: string; body?: string };
      const paragraphs = arr<StoryPara>(settings, "paragraphs")
        .filter((p) => !!p.body)
        .map((p) => ({ heading: p.heading || undefined, body: p.body ?? "" }));
      return (
        <StorySection
          key={section.id}
          title={s(settings, "title")}
          intro={s(settings, "description") || undefined}
          image={s(settings, "media") || undefined}
          paragraphs={paragraphs}
        />
      );
    }

    // ── RISK_REVERSAL ─────────────────────────────────────────────────────────
    // Canonical: settings.title, settings.guaranteeText, settings.description,
    //            settings.steps — string[]
    case "RISK_REVERSAL": {
      const steps = arr<string>(settings, "steps").map((title) => ({
        title,
        description: "",
      }));
      return (
        <RiskReversalSection
          key={section.id}
          title={s(settings, "title")}
          guaranteeText={s(settings, "guaranteeText")}
          description={s(settings, "description")}
          steps={steps}
        />
      );
    }

    default:
      return null;
  }
}
