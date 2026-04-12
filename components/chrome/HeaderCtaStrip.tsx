"use client";

import { useSectionRegistry } from "@/lib/stores/sectionRegistry";
import type { SectionType } from "@/types/storefront";

interface HeaderCtaStripProps {
  /** Text shown in the strip. */
  label?: string;
  /**
   * Preferred scroll target, in order. The first matching section found
   * in the registry wins. Defaults to EXPERT → TESTIMONIALS.
   */
  targetTypes?: SectionType[];
}

/**
 * Slim, full-width CTA directly under the header. Clicking it smoothly
 * scrolls to the first matching section from `targetTypes`.
 *
 * Deliberately visible but secondary to the header. The strip hides
 * itself if no target section exists on the page — the store editor
 * can still set a label in config without breaking pages that happen
 * to not have an expert or testimonial block.
 */
export default function HeaderCtaStrip({
  label = "Zobacz opinie fizjoterapeutów",
  targetTypes = ["EXPERT", "TESTIMONIALS"],
}: HeaderCtaStripProps) {
  const sections = useSectionRegistry((s) => s.sections);

  // Resolve the first target that exists on the page.
  const target = targetTypes
    .map((type) => sections.find((s) => s.type === type))
    .find((s): s is NonNullable<typeof s> => !!s);

  if (!target) return null;

  function handleClick() {
    const el = document.getElementById(target!.id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group w-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] text-xs md:text-sm font-semibold tracking-wide px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-[var(--color-accent)]/15 transition-colors border-b border-[var(--color-border)] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent)]"
    >
      <span>👉 {label}</span>
      <svg
        className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}
