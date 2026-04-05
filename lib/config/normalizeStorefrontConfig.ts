import type { StorefrontConfig, SectionEntry, SectionType } from "@/types/storefront";

const DEFAULT_SECTIONS: SectionEntry[] = [
  { type: "announcementBar", enabled: true },
  { type: "hero", enabled: true },
  { type: "trustBar", enabled: true },
  { type: "benefits", enabled: true },
  { type: "problem", enabled: true },
  { type: "features", enabled: true },
  { type: "comparison", enabled: true },
  { type: "testimonials", enabled: true },
  { type: "offer", enabled: true },
  { type: "faq", enabled: true },
  { type: "finalCta", enabled: true },
  { type: "footer", enabled: true },
];

export function normalizeStorefrontConfig(config: StorefrontConfig): StorefrontConfig {
  const sections = config.sections.length > 0 ? config.sections : DEFAULT_SECTIONS;

  // Disable sections that don't have corresponding config data
  const normalizedSections = sections.map((s) => {
    const sectionData = getSectionData(config, s.type);
    if (s.enabled && sectionData === undefined) {
      return { ...s, enabled: false };
    }
    return s;
  });

  return {
    ...config,
    sections: normalizedSections,
  };
}

function getSectionData(config: StorefrontConfig, type: SectionType): unknown {
  switch (type) {
    case "announcementBar": return config.announcementBar;
    case "hero": return config.hero;
    case "trustBar": return config.trustBar;
    case "benefits": return config.benefits;
    case "problem": return config.problem;
    case "features": return config.features;
    case "comparison": return config.comparison;
    case "testimonials": return config.testimonials;
    case "offer": return config.offer;
    case "faq": return config.faq;
    case "finalCta": return config.finalCta;
    case "footer": return config.footer;
    default: return undefined;
  }
}
