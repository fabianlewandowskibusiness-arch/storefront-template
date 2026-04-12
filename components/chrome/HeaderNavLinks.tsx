"use client";

import { useSectionRegistry } from "@/lib/stores/sectionRegistry";
import type { SectionType } from "@/types/storefront";

// Fixed slot order — these labels and section-type targets are the
// canonical desktop nav. If a given section doesn't exist in the current
// page's registry, the slot is simply skipped.
const SLOTS: { label: string; type: SectionType }[] = [
  { label: "Produkt", type: "HERO" },
  { label: "Opinie", type: "TESTIMONIALS" },
  { label: "Porównanie", type: "COMPARISON" },
  { label: "FAQ", type: "FAQ" },
];

export default function HeaderNavLinks() {
  const sections = useSectionRegistry((s) => s.sections);

  // Resolve each slot to a concrete registered section, dropping slots
  // whose target type isn't on the current page.
  const resolved = SLOTS.map((slot) => {
    const target = sections.find((s) => s.type === slot.type);
    return target ? { ...slot, id: target.id } : null;
  }).filter((x): x is { label: string; type: SectionType; id: string } => !!x);

  if (resolved.length === 0) return null;

  function handleClick(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="hidden md:flex items-center gap-7" aria-label="Główna nawigacja">
      {resolved.map((slot) => (
        <button
          key={slot.type}
          type="button"
          onClick={() => handleClick(slot.id)}
          className="header-nav-link text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors focus:outline-none"
        >
          {slot.label}
        </button>
      ))}
    </nav>
  );
}
