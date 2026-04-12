"use client";

import { useUiStore } from "@/lib/stores/uiStore";
import { useSectionRegistry } from "@/lib/stores/sectionRegistry";
import Drawer from "./Drawer";
import type { BrandingConfig, SectionType } from "@/types/storefront";

interface NavigationDrawerProps {
  branding: BrandingConfig;
}

export default function NavigationDrawer({ branding }: NavigationDrawerProps) {
  const open = useUiStore((s) => s.navOpen);
  const closeNav = useUiStore((s) => s.closeNav);
  const sections = useSectionRegistry((s) => s.sections);

  const sorted = [...sections].sort((a, b) => a.order - b.order);

  function scrollToId(id: string) {
    closeNav();
    // Defer scroll until the drawer close animation has started — otherwise
    // the body scroll lock release fights the scrollIntoView call for one
    // frame and the scroll visibly stutters on Safari.
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function scrollToType(type: SectionType) {
    const target = sections.find((s) => s.type === type);
    if (target) scrollToId(target.id);
    else closeNav();
  }

  return (
    <Drawer open={open} onClose={closeNav} side="left" title="Menu">
      <div className="flex flex-col h-full">
        {/* ── Brand block ── */}
        <div className="px-5 py-5 border-b border-[var(--color-border)]">
          <p className="font-extrabold text-[var(--color-text)] text-base uppercase tracking-tight">
            {branding.storeName}
          </p>
          {branding.tagline && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
              {branding.tagline}
            </p>
          )}
        </div>

        {/* ── Nav list ── */}
        <div className="flex-1 overflow-y-auto">
          <p className="px-5 pt-5 pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            Sklep
          </p>
          {sorted.length === 0 ? (
            <p className="px-5 py-4 text-sm text-[var(--color-text-muted)]">
              Brak pozycji nawigacji.
            </p>
          ) : (
            <ul>
              {sorted.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => scrollToId(entry.id)}
                    className="w-full text-left px-5 py-3 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors focus:outline-none focus-visible:bg-[var(--color-surface)]"
                  >
                    {entry.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Footer CTAs ── */}
        <div className="px-5 py-4 border-t border-[var(--color-border)] space-y-2">
          <button
            type="button"
            onClick={() => scrollToType("OFFER")}
            className="w-full rounded-[var(--radius)] bg-[var(--color-accent)] text-white font-semibold text-sm py-3 transition-all hover:brightness-110 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            Kup teraz
          </button>
          <button
            type="button"
            onClick={() => scrollToType("TESTIMONIALS")}
            className="w-full rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--color-text)] font-semibold text-sm py-3 transition-colors hover:bg-[var(--color-surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            Zobacz opinie
          </button>
        </div>
      </div>
    </Drawer>
  );
}
