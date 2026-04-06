import type { StorefrontSection, StorefrontBlock, BrandingConfig, CommerceConfig } from "@/types/storefront";
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

function s(settings: Record<string, unknown>, key: string): string {
  return (settings[key] as string) ?? "";
}

function sNum(settings: Record<string, unknown>, key: string): number {
  return (settings[key] as number) ?? 0;
}

function blockSettings(blocks: StorefrontBlock[]): Record<string, unknown>[] {
  return blocks.map((b) => b.settings);
}

export function renderSection(section: StorefrontSection, ctx: RenderContext) {
  const { settings, blocks } = section;

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
          heroVariant={s(settings, "heroVariant") || "split-image"}
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
          items={blockSettings(blocks) as { title: string; description: string }[]}
        />
      );

    case "PROBLEM":
      return (
        <ProblemSection
          key={section.id}
          title={s(settings, "title")}
          description={s(settings, "description")}
          painPoints={blocks.map((b) => s(b.settings, "text"))}
        />
      );

    case "FEATURES":
      return (
        <FeaturesSection
          key={section.id}
          title={s(settings, "title")}
          items={blockSettings(blocks) as { name: string; description: string }[]}
        />
      );

    case "COMPARISON":
      return (
        <ComparisonSection
          key={section.id}
          title={s(settings, "title")}
          brandName={ctx.branding.productName}
          rows={blockSettings(blocks) as { label: string; ours: string; other: string }[]}
        />
      );

    case "TESTIMONIALS":
      return (
        <TestimonialsSection
          key={section.id}
          title={s(settings, "title")}
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
          included={blocks.filter((b) => b.type === "included_item").map((b) => s(b.settings, "text"))}
        />
      );

    case "FAQ":
      return (
        <FaqSection
          key={section.id}
          title={s(settings, "title")}
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
        />
      );

    case "FOOTER":
      return (
        <FooterSection
          key={section.id}
          storeName={ctx.branding.storeName}
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
