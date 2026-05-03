import type { SectionType } from "@/types/storefront";

/**
 * Canonical map of which section types consume which media fields.
 *
 * This file is the source of truth, inside the storefront repo, for the
 * question "where does media go?". It mirrors the media contract owned
 * by the main ecommerce-flow.ai repo:
 *
 *   • single media fields  → value is `null` when no media attached
 *   • gallery array fields → value is `[]`   when no media attached
 *   • placeholder asset paths are NOT data — the storefront template
 *     is solely responsible for visual fallbacks when media is absent.
 *
 * Every section component that renders one of these fields MUST provide
 * an explicit missing-media UI state. The per-section implementation of
 * that fallback lives in the corresponding component file; search the
 * component for a `Missing-media fallback` comment to find it.
 *
 * Path syntax:
 *   "foo"            → section.data.foo
 *   "foo[].bar"      → each element of section.data.foo has a `bar` field
 *   "a.b"            → nested object on section.data
 */
export interface SectionMediaDependency {
  /** Single media fields — each resolves to a string URL or `null`. */
  readonly singles: readonly string[];
  /** Gallery fields — each resolves to a `string[]` (possibly empty). */
  readonly galleries: readonly string[];
}

/**
 * Section → media field dependencies.
 *
 * Sections omitted from this map have no media dependency. Keep this
 * aligned with the canonical contract; do not add fields the renderer
 * does not actually read.
 */
export const SECTION_MEDIA_FIELDS = {
  HERO: {
    singles: ["videoUrl"],
    galleries: ["gallery"],
  },
  COMPARISON: {
    singles: ["ourProductImage", "comparedProductImage"],
    galleries: [],
  },
  UGC: {
    singles: ["items[].imageUrl"],
    galleries: [],
  },
  EXPERT: {
    singles: ["expertImage"],
    galleries: [],
  },
  TESTIMONIALS: {
    singles: ["testimonials[].avatarUrl"],
    galleries: [],
  },
  STORY: {
    singles: ["media"],
    galleries: [],
  },
} as const satisfies Partial<Record<SectionType, SectionMediaDependency>>;

/**
 * Returns true when the given section type consumes any media field.
 * Useful for editor-side UX (e.g. "does this section expect media?")
 * and for tests that assert the renderer handles every media-bearing
 * section type.
 */
export function hasMediaDependency(type: SectionType): boolean {
  const deps = (SECTION_MEDIA_FIELDS as Partial<Record<SectionType, SectionMediaDependency>>)[type];
  if (!deps) return false;
  return deps.singles.length > 0 || deps.galleries.length > 0;
}
