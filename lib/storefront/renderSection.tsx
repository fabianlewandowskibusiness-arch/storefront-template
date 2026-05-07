import type {
  StorefrontSection,
  BrandingConfig,
  CommerceConfig,
  GalleryItem,
  HeroPackage,
  ImageFrame,
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

// ── Data helpers ─────────────────────────────────────────────────────────────
//
// All section content is in `data` — the single source of truth for all
// section content. The renderer reads exclusively from this field.

function s(data: Record<string, unknown> | null, key: string): string {
  return (data?.[key] as string) ?? "";
}

function sNum(data: Record<string, unknown> | null, key: string): number {
  const v = data?.[key];
  return typeof v === "number" ? v : 0;
}

function sBool(data: Record<string, unknown> | null, key: string): boolean {
  return Boolean(data?.[key]);
}

function arr<T>(data: Record<string, unknown> | null, key: string): T[] {
  const v = data?.[key];
  return Array.isArray(v) ? (v as T[]) : [];
}

// ── Shell override extraction ──────────────────────────────────────────────────

function extractShellOverride(
  data: Record<string, unknown> | null,
): ShellOverride | undefined {
  if (!data) return undefined;
  const bg = data._backgroundStyle as ShellOverride["backgroundStyle"] | undefined;
  const pt = data._paddingTop as ShellOverride["paddingTop"] | undefined;
  const pb = data._paddingBottom as ShellOverride["paddingBottom"] | undefined;
  if (!bg && !pt && !pb) return undefined;
  return { backgroundStyle: bg, paddingTop: pt, paddingBottom: pb };
}

// ── Main renderer ─────────────────────────────────────────────────────────────

export function renderSection(section: StorefrontSection, ctx: RenderContext) {
  const data = section.data ?? {};

  // Visibility flag — skip hidden sections entirely.
  if (data._visible === false) return null;

  const shellOverride = extractShellOverride(data);
  const sectionVariant = (data._sectionVariant as string) || "";

  switch (section.type) {
    // ── ANNOUNCEMENT ────────────────────────────────────────────────────────
    // The announcement ticker is now rendered as chrome (above the sticky
    // header) rather than in the page flow. The layout reads the items and
    // passes them to StorefrontChrome. The renderer simply skips it so we
    // don't double-render.
    case "ANNOUNCEMENT":
      return null;

    // ── HERO ─────────────────────────────────────────────────────────────────
    // Canonical data:
    //   gallery: string[]                     — ordered product image URLs
    //   packages: PackageOption[]             — { name, quantity, price, compareAtPrice, label, isDefault, savingsText, badge, ctaHref, ... }
    //   bullets: string[]                     — short ≤5-word benefit phrases
    //   socialProof: { averageRating?, reviewCount?, customerCountText?, ... }
    //   primaryCtaLabel, secondaryCtaLabel
    //   trustBadge, deliveryInfo, paymentInfo — legacy display hints (optional)
    //   stickyBuyBar: StickyBuyBarSettings
    //
    // Media contract (see lib/storefront/mediaFields.ts):
    //   • gallery is the gallery field — may be `[]`. HeroSection renders
    //     a neutral product-photo placeholder when the gallery is empty.
    case "HERO": {
      // Gallery: prepend videoUrl (if set) then map gallery images → GalleryItem[].
      // The video always appears first so it is the primary media in the hero carousel.
      const videoUrl = s(data, "videoUrl");
      // Section-level imageFrame applies to all gallery images when present.
      const imageFrame = (data.imageFrame as ImageFrame | null) ?? null;
      const gallery: GalleryItem[] = [];
      if (videoUrl) {
        gallery.push({ url: videoUrl, alt: ctx.branding.productName, type: "video" as const });
      }
      gallery.push(
        ...arr<string>(data, "gallery").map(
          (url) => ({
            url,
            alt: ctx.branding.productName,
            type: "image" as const,
            frame: imageFrame ?? undefined,
          }),
        ),
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
      const packages: HeroPackage[] = arr<PkgOpt>(data, "packages").map(
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

      const bullets = arr<string>(data, "bullets");

      // Social proof — canonical: data.socialProof object
      type SocialProof = { averageRating?: number; reviewCount?: number };
      const sp = data.socialProof as SocialProof | undefined;

      return (
        <HeroSection
          key={section.id}
          headline={s(data, "headline")}
          subheadline={s(data, "subheadline") || undefined}
          description={s(data, "description") || undefined}
          rating={sp?.averageRating || undefined}
          reviewCount={sp?.reviewCount || undefined}
          bullets={bullets}
          trustBadge={s(data, "trustBadge") || undefined}
          riskReversal={s(data, "riskReversal") || undefined}
          deliveryInfo={s(data, "deliveryInfo") || undefined}
          paymentInfo={s(data, "paymentInfo") || undefined}
          gallery={gallery}
          packages={packages}
          fallbackCheckoutUrl={ctx.checkoutUrl}
          fallbackCtaLabel={
            s(data, "primaryCtaLabel") ||
            ctx.commerce?.ctaButtonLabel ||
            "Kup teraz"
          }
          currency={ctx.currency}
          productName={ctx.branding.productName}
        />
      );
    }

    // ── TRUST_BAR ────────────────────────────────────────────────────────────
    // Canonical: data.items — string[]
    case "TRUST_BAR":
      return (
        <TrustBarSection
          key={section.id}
          items={arr<string>(data, "items")}
        />
      );

    // ── BENEFITS ─────────────────────────────────────────────────────────────
    // Canonical: data.title, data.items — BenefitItem[]
    case "BENEFITS":
      return (
        <BenefitsSection
          key={section.id}
          title={s(data, "title")}
          sectionVariant={sectionVariant}
          shellOverride={shellOverride}
          items={
            arr<{ title: string; description: string }>(data, "items")
          }
        />
      );

    // ── PROBLEM ──────────────────────────────────────────────────────────────
    // Canonical: data.title, data.description, data.items — ProblemItem[]
    case "PROBLEM":
      return (
        <ProblemSection
          key={section.id}
          title={s(data, "title")}
          description={s(data, "description") || undefined}
          items={arr<{ title: string; description: string }>(data, "items")}
          shellOverride={shellOverride}
        />
      );

    // ── FEATURES ─────────────────────────────────────────────────────────────
    // Canonical: data.title, data.items — { name, description }[]
    case "FEATURES":
      return (
        <FeaturesSection
          key={section.id}
          title={s(data, "title")}
          shellOverride={shellOverride}
          items={arr<{ name: string; description: string }>(data, "items")}
        />
      );

    // ── COMPARISON ───────────────────────────────────────────────────────────
    // Canonical: data.title, data.subtitle,
    //            data.rows — { feature, productValue, competitorValue }[]
    //            data.ourProductImage      — our product image (optional, falls back to heroImage)
    //            data.comparedProductImage — competitor product image (optional)
    // renderSection maps backend field names → component prop names
    case "COMPARISON": {
      type CompRow = {
        feature?: string;
        productValue?: string;
        competitorValue?: string;
      };
      const rows = arr<CompRow>(data, "rows").map((r) => ({
        label: r.feature ?? "",
        ours: r.productValue ?? "",
        other: r.competitorValue ?? "",
      }));
      // Our product image: explicit section field takes precedence over the
      // context heroImage so editors can pick a different crop for comparison.
      const ourImage = s(data, "ourProductImage") || ctx.heroImage;
      const comparedImage = s(data, "comparedProductImage") || undefined;
      const ourProductImageFrame = (data.ourProductImageFrame as ImageFrame | null) ?? null;
      const comparedProductImageFrame = (data.comparedProductImageFrame as ImageFrame | null) ?? null;
      return (
        <ComparisonSection
          key={section.id}
          title={s(data, "title")}
          subtitle={s(data, "subtitle") || undefined}
          brandName={ctx.branding.productName}
          productImage={ourImage}
          productImageFrame={ourProductImageFrame}
          comparedProductImage={comparedImage}
          comparedProductImageFrame={comparedProductImageFrame}
          shellOverride={shellOverride}
          rows={rows}
        />
      );
    }

    // ── TESTIMONIALS ─────────────────────────────────────────────────────────
    // Canonical: data.title, data.testimonials — Testimonial[]
    // renderSection maps Testimonial fields → component prop names
    //
    // Media contract (see lib/storefront/mediaFields.ts):
    //   • testimonials[].avatarUrl — may be `null`. TestimonialsCarousel
    //     renders an initial-letter circle when the avatar is absent.
    case "TESTIMONIALS": {
      type TestItem = {
        authorName?: string;
        avatarUrl?: string;
        avatarFrame?: ImageFrame | null;
        quoteShort?: string;
        quoteLong?: string;
        rating?: number;
        location?: string;
      };
      const items = arr<TestItem>(data, "testimonials").map((t) => ({
        name: t.authorName ?? "",
        quote: t.quoteShort || t.quoteLong || "",
        avatar: t.avatarUrl || undefined,
        avatarFrame: t.avatarFrame ?? undefined,
        rating: t.rating || undefined,
        location: t.location || undefined,
      }));
      return (
        <TestimonialsSection
          key={section.id}
          title={s(data, "title")}
          shellOverride={shellOverride}
          items={items}
        />
      );
    }

    // ── OFFER ────────────────────────────────────────────────────────────────
    // Canonical: data.title, data.price, data.compareAtPrice,
    //            data.included — string[], data.guaranteeText, etc.
    case "OFFER":
      return (
        <OfferSection
          key={section.id}
          title={s(data, "title")}
          priceLabel={s(data, "priceLabel")}
          price={sNum(data, "price")}
          compareAtPrice={sNum(data, "compareAtPrice") || undefined}
          currency={s(data, "currency") || ctx.currency}
          ctaLabel={s(data, "ctaLabel") || ctx.commerce?.ctaButtonLabel || ""}
          checkoutUrl={ctx.checkoutUrl}
          anchorId={s(data, "anchorId") || "offer"}
          guaranteeText={s(data, "guaranteeText")}
          shellOverride={shellOverride}
          included={arr<string>(data, "included")}
        />
      );

    // ── FAQ ──────────────────────────────────────────────────────────────────
    // Canonical: data.title, data.items — { question, answer }[]
    case "FAQ":
      return (
        <FaqSection
          key={section.id}
          title={s(data, "title")}
          shellOverride={shellOverride}
          items={arr<{ question: string; answer: string }>(data, "items")}
        />
      );

    // ── CTA ──────────────────────────────────────────────────────────────────
    // Canonical: data.headline, data.subheadline, data.buttonLabel,
    //            data.trustItems — string[]
    case "CTA":
      return (
        <FinalCtaSection
          key={section.id}
          headline={s(data, "headline")}
          subheadline={s(data, "subheadline") || undefined}
          buttonLabel={
            s(data, "buttonLabel") || ctx.commerce?.ctaButtonLabel || "Kup teraz"
          }
          checkoutUrl={ctx.checkoutUrl}
          trustItems={arr<string>(data, "trustItems")}
          shellOverride={shellOverride}
        />
      );

    // ── FOOTER (deprecated — chrome Footer is the canonical footer) ────────
    //
    // The footer is now rendered by the chrome-level <Footer /> component in
    // the storefront layout (components/chrome/Footer.tsx). It uses branding,
    // sectionRegistry, and legalPages — not this section's data.
    //
    // Old configs may still include a FOOTER section. We keep the enum value
    // in the schema so those configs parse without error, but the renderer
    // returns null so no duplicate footer ever appears on the page.
    case "FOOTER":
      return null;

    // ── UGC ──────────────────────────────────────────────────────────────────
    // Canonical: data.title, data.description,
    //            data.items — UgcItem[]
    //
    // Media contract (see lib/storefront/mediaFields.ts):
    //   • items[].imageUrl is the single media field — may be `null`.
    //   • Items WITHOUT media still flow through to the card; the card
    //     (UgcLoopCarousel.Card) renders a neutral branded fallback when
    //     `media.url` is empty. We only drop items missing the quote,
    //     since a review card with no text is structurally empty.
    case "UGC": {
      type UgcItm = {
        imageUrl?: string;
        videoUrl?: string;
        authorName?: string;
        caption?: string;
        rating?: number;
        location?: string;
        imageFrame?: ImageFrame | null;
      };
      const reviews = arr<UgcItm>(data, "items")
        .map((item, i) => ({
          id: `ugc-${i}`,
          media: {
            url: item.videoUrl || item.imageUrl || "",
            type: (item.videoUrl ? "video" : "image") as "image" | "video",
            alt: item.authorName || undefined,
            frame: item.imageFrame ?? null,
          },
          quote: item.caption || "",
          name: item.authorName || "",
          location: item.location || undefined,
          rating: item.rating || undefined,
        }))
        .filter((r) => !!r.quote);
      return (
        <UgcSection
          key={section.id}
          title={s(data, "title")}
          description={s(data, "description") || undefined}
          reviews={reviews}
        />
      );
    }

    // ── EXPERT ───────────────────────────────────────────────────────────────
    // Canonical: all fields in data
    //
    // Media contract (see lib/storefront/mediaFields.ts):
    //   • expertImage — may be `null`. ExpertSection renders a branded
    //     initials placeholder when both expertImage and videoUrl are absent.
    case "EXPERT":
      return (
        <ExpertSection
          key={section.id}
          title={s(data, "title")}
          description={s(data, "description")}
          expertName={s(data, "expertName")}
          expertRole={s(data, "expertRole") || undefined}
          expertImage={s(data, "expertImage") || s(data, "expertAvatarUrl") || s(data, "image") || undefined}
          expertImageFrame={
            (data.expertImageFrame as ImageFrame | null) ??
            (data.imageFrame as ImageFrame | null) ??
            null
          }
          videoUrl={s(data, "videoUrl") || undefined}
          quote={s(data, "quote") || undefined}
        />
      );

    // ── STORY ────────────────────────────────────────────────────────────────
    // Canonical: data.title, data.description (intro),
    //            data.media (image URL),
    //            data.paragraphs — { heading?, body }[]
    //
    // Media contract (see lib/storefront/mediaFields.ts):
    //   • media — may be `null`. StorySection gracefully collapses to a
    //     centered single-column layout when no media is provided.
    case "STORY": {
      type StoryPara = { heading?: string; body?: string };
      const paragraphs = arr<StoryPara>(data, "paragraphs")
        .filter((p) => !!p.body)
        .map((p) => ({ heading: p.heading || undefined, body: p.body ?? "" }));
      return (
        <StorySection
          key={section.id}
          title={s(data, "title")}
          intro={s(data, "description") || undefined}
          image={s(data, "media") || undefined}
          imageFrame={(data.mediaFrame as ImageFrame | null) ?? null}
          paragraphs={paragraphs}
        />
      );
    }

    // ── RISK_REVERSAL ─────────────────────────────────────────────────────────
    // Canonical: data.title, data.guaranteeText, data.description,
    //            data.steps — string[]
    case "RISK_REVERSAL": {
      const steps = arr<string>(data, "steps").map((title) => ({
        title,
        description: "",
      }));
      return (
        <RiskReversalSection
          key={section.id}
          title={s(data, "title")}
          guaranteeText={s(data, "guaranteeText")}
          description={s(data, "description")}
          steps={steps}
        />
      );
    }

    default:
      return null;
  }
}
