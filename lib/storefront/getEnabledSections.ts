import type { SectionEntry } from "@/types/storefront";

export function getEnabledSections(sections: SectionEntry[]): SectionEntry[] {
  return sections.filter((s) => s.enabled);
}
