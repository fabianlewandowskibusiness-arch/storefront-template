"use client";

import {
  useEffect,
  useState,
  type MouseEvent,
  type RefObject,
} from "react";
import { formatPrice } from "@/lib/utils/formatPrice";

interface MobileBuyBarProps {
  /** Ref to the hero section — the bar appears once this scrolls out of view. */
  triggerRef: RefObject<HTMLElement | null>;
  packageLabel: string;
  price: number;
  comparePrice?: number;
  currency: string;
  ctaLabel: string;
  ctaHref: string;
  /**
   * Click handler. Receives the anchor click event so callers can
   * preventDefault() to intercept navigation (e.g. open the cart drawer
   * instead of going to the checkout URL).
   */
  onCtaClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Sticky mobile-only buy bar. Fixed to the bottom of the viewport and
 * slides in once the hero scrolls past. Shows the currently-selected
 * package, live price, and a full-width CTA that reuses the same href
 * as the hero CTA.
 *
 * Desktop never sees it (hidden via md:hidden) — desktop has the sticky
 * hero sidebar instead.
 */
export default function MobileBuyBar({
  triggerRef,
  packageLabel,
  price,
  comparePrice,
  currency,
  ctaLabel,
  ctaHref,
  onCtaClick,
}: MobileBuyBarProps) {
  const [visible, setVisible] = useState(false);
  const hasDiscount = comparePrice && comparePrice > price;

  useEffect(() => {
    const el = triggerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show the bar when the hero is NOT visible.
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [triggerRef]);

  return (
    <div
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 bg-[var(--color-background)] border-t border-[var(--color-border)] shadow-[0_-6px_20px_rgba(0,0,0,0.10)] transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <div className="px-4 py-2.5 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-[var(--color-text-muted)] leading-none truncate">
            {packageLabel}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-extrabold text-[var(--color-text)] leading-none tabular-nums">
              {formatPrice(price, currency)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-[var(--color-text-muted)] line-through leading-none tabular-nums">
                {formatPrice(comparePrice, currency)}
              </span>
            )}
          </div>
        </div>
        <a
          href={ctaHref}
          onClick={onCtaClick}
          className="shrink-0 bg-[var(--color-accent)] text-white font-bold text-sm px-6 py-3.5 rounded-[var(--radius)] shadow-md transition-all active:scale-[0.98] active:brightness-95 hover:brightness-110"
        >
          {ctaLabel}
        </a>
      </div>
      {/* iOS home-indicator safe area */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
