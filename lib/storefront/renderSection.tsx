import type { StorefrontConfig, SectionType } from "@/types/storefront";
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

interface RenderSectionProps {
  type: SectionType;
  config: StorefrontConfig;
  checkoutUrl: string;
}

export function renderSection({ type, config, checkoutUrl }: RenderSectionProps) {
  switch (type) {
    case "announcementBar":
      return config.announcementBar ? (
        <AnnouncementBar key={type} config={config.announcementBar} />
      ) : null;
    case "hero":
      return (
        <HeroSection
          key={type}
          config={config.hero}
          product={config.product}
          heroVariant={config.theme.style.heroVariant}
        />
      );
    case "trustBar":
      return config.trustBar ? (
        <TrustBarSection key={type} config={config.trustBar} />
      ) : null;
    case "benefits":
      return config.benefits ? (
        <BenefitsSection key={type} config={config.benefits} />
      ) : null;
    case "problem":
      return config.problem ? (
        <ProblemSection key={type} config={config.problem} />
      ) : null;
    case "features":
      return config.features ? (
        <FeaturesSection key={type} config={config.features} />
      ) : null;
    case "comparison":
      return config.comparison ? (
        <ComparisonSection key={type} config={config.comparison} brandName={config.brand.productName} />
      ) : null;
    case "testimonials":
      return config.testimonials ? (
        <TestimonialsSection key={type} config={config.testimonials} />
      ) : null;
    case "offer":
      return config.offer ? (
        <OfferSection
          key={type}
          config={config.offer}
          product={config.product}
          checkoutUrl={checkoutUrl}
        />
      ) : null;
    case "faq":
      return config.faq ? (
        <FaqSection key={type} config={config.faq} />
      ) : null;
    case "finalCta":
      return config.finalCta ? (
        <FinalCtaSection key={type} config={config.finalCta} checkoutUrl={checkoutUrl} />
      ) : null;
    case "footer":
      return config.footer ? (
        <FooterSection key={type} config={config.footer} brand={config.brand} />
      ) : null;
    default:
      return null;
  }
}
