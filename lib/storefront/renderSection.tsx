import type { StorefrontSection, StorefrontBlock, BrandingConfig, CommerceConfig } from "@/types/storefront";
import type { ShellOverride } from "@/components/layout/SectionShell";
import AnnouncementBar from "@/components/sections/AnnouncementBar";
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
import FooterSection from "@/components/sections/FooterSection";

interface RenderContext {
  branding: BrandingConfig;
  commerce: CommerceConfig;
  checkoutUrl: string;
}

// ── Settings helpers ───────────────────────────────────────────────────────────

function s(settings: Record<string, unknown>, key: string): string {
  return (settings[key] as string) ?? "";
}

function sNum(settings: Record<string, unknown>, key: string): number {
  return (settings[key] as number) ?? 0;
}

function blockSettings(blocks: StorefrontBlock[]): Record<string, unknown>[] {
  return blocks.map((b) => b.settings);
}

// ── Phase-2: meta key extraction ───────────────────────────────────────────────

/**
 * Builds a ShellOverride from a section's settings.
 * Returns undefined when no override keys are present (preserves section defaults).
 */
function extractShellOverride(settings: Record<string, unknown>): ShellOverride | undefined {
  const bg  = settings["_backgroundStyle"] as ShellOverride["backgroundStyle"] | undefined;
  const pt  = settings["_paddingTop"]      as ShellOverride["paddingTop"]      | undefined;
  const pb  = settings["_paddingBottom"]   as ShellOverride["paddingBottom"]   | undefined;
  if (!bg && !pt && !pb) return undefined;
  return { backgroundStyle: bg, paddingTop: pt, paddingBottom: pb };
}

// ── Main renderer ──────────────────────────────────────────────────────────────

export function renderSection(section: StorefrontSection, ctx: RenderContext) {
  const { settings, blocks } = section;

  // ── Visibility: skip hidden sections entirely (not CSS display:none) ──
  if (settings["_visible"] === false) return null;

  // ── Style meta — extracted once, passed to section components ──
  const shellOverride   = extractShellOverride(settings);
  const sectionVariant  = (settings["_sectionVariant"] as string) || "";

  switch (section.type) {
    case "ANNOUNCEMENT_BAR":
      return (
        <AnnouncementBar
          key={section.id}
          text={s(settings, "text")}
        />
      );

    case "HERO":
      return (
        <HeroSection
          key={section.id}
          eyebrow={s(settings, "eyebrow")}
          headline={s(settings, "headline")}
          subheadline={s(settings, "subheadline")}
          primaryCtaLabel={s(settings, "primaryCtaLabel")}
          primaryCtaHref={s(settings, "primaryCtaHref")}
          secondaryCtaLabel={s(settings, "secondaryCtaLabel")}
          secondaryCtaHref={s(settings, "secondaryCtaHref")}
          image={s(settings, "image")}
          imageAlt={ctx.branding.productName}
          // _sectionVariant takes precedence; legacy heroVariant key kept as fallback
          sectionVariant={sectionVariant || s(settings, "heroVariant") || "split-image"}
          shellOverride={shellOverride}
          bullets={blocks.filter((b) => b.type === "benefit_bullet").map((b) => s(b.settings, "text"))}
          badges={blocks.filter((b) => b.type === "badge").map((b) => s(b.settings, "text"))}
        />
      );

    case "TRUST_BAR":
      return (
        <TrustBarSection
          key={section.id}
          items={blocks.map((b) => s(b.settings, "text"))}
        />
      );

    case "BENEFITS":
      return (
        <BenefitsSection
          key={section.id}
          title={s(settings, "title")}
          sectionVariant={sectionVariant}
          shellOverride={shellOverride}
          items={blockSettings(blocks) as { title: string; description: string }[]}
        />
      );

    case "PROBLEM":
      return (
        <ProblemSection
          key={section.id}
          title={s(settings, "title")}
          description={s(settings, "description")}
          shellOverride={shellOverride}
          painPoints={blocks.map((b) => s(b.settings, "text"))}
        />
      );

    case "FEATURES":
      return (
        <FeaturesSection
          key={section.id}
          title={s(settings, "title")}
          shellOverride={shellOverride}
          items={blockSettings(blocks) as { name: string; description: string }[]}
        />
      );

    case "COMPARISON":
      return (
        <ComparisonSection
          key={section.id}
          title={s(settings, "title")}
          brandName={ctx.branding.productName}
          shellOverride={shellOverride}
          rows={blockSettings(blocks) as { label: string; ours: string; other: string }[]}
        />
      );

    case "TESTIMONIALS":
      return (
        <TestimonialsSection
          key={section.id}
          title={s(settings, "title")}
          sectionVariant={sectionVariant}
          shellOverride={shellOverride}
          items={blockSettings(blocks) as { name: string; quote: string; avatar?: string }[]}
        />
      );

    case "OFFER":
      return (
        <OfferSection
          key={section.id}
          title={s(settings, "title")}
          priceLabel={s(settings, "priceLabel")}
          price={sNum(settings, "price")}
          compareAtPrice={sNum(settings, "compareAtPrice") || undefined}
          currency={s(settings, "currency") || "PLN"}
          ctaLabel={s(settings, "ctaLabel") || ctx.commerce.ctaButtonLabel}
          checkoutUrl={ctx.checkoutUrl}
          anchorId={s(settings, "anchorId") || "offer"}
          guaranteeText={s(settings, "guaranteeText")}
          shellOverride={shellOverride}
          included={blocks.filter((b) => b.type === "included_item").map((b) => s(b.settings, "text"))}
        />
      );

    case "FAQ":
      return (
        <FaqSection
          key={section.id}
          title={s(settings, "title")}
          shellOverride={shellOverride}
          items={blockSettings(blocks) as { question: string; answer: string }[]}
        />
      );

    case "CTA":
      return (
        <FinalCtaSection
          key={section.id}
          headline={s(settings, "headline")}
          subheadline={s(settings, "subheadline")}
          buttonLabel={s(settings, "buttonLabel") || ctx.commerce.ctaButtonLabel}
          checkoutUrl={ctx.checkoutUrl}
          shellOverride={shellOverride}
        />
      );

    case "FOOTER":
      return (
        <FooterSection
          key={section.id}
          storeName={ctx.branding.storeName}
          logoUrl={ctx.branding.logoUrl || undefined}
          contactEmail={s(settings, "contactEmail")}
          links={blocks.filter((b) => b.type === "link").map((b) => ({
            label: s(b.settings, "label"),
            href: s(b.settings, "href"),
          }))}
        />
      );

    default:
      return null;
  }
}
