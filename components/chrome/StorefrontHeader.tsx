"use client";

import { useEffect, useState } from "react";
import { useUiStore, selectCartCount } from "@/lib/stores/uiStore";
import { cn } from "@/lib/utils/cn";
import HeaderNavLinks from "./HeaderNavLinks";

interface StorefrontHeaderProps {
  storeName: string;
  /**
   * Canonical `branding.logoUrl` from the storefront config. May be an empty
   * string when no logo has been uploaded; may also be a broken URL at
   * runtime. The header handles both gracefully — see `BrandMark` below.
   */
  logoUrl?: string;
}

export default function StorefrontHeader({ storeName, logoUrl }: StorefrontHeaderProps) {
  const toggleNav = useUiStore((s) => s.toggleNav);
  const toggleCart = useUiStore((s) => s.toggleCart);
  const cartCount = useUiStore(selectCartCount);
  const [scrolled, setScrolled] = useState(false);
  // Track logo load failures so a broken URL (deleted media, expired signed
  // URL, blocked host, etc.) silently degrades to the text-only brand mark
  // instead of leaving a broken-image glyph in the header.
  const [logoBroken, setLogoBroken] = useState(false);
  const showLogo = !!logoUrl && !logoBroken;

  // Shadow-on-scroll — single rAF-throttled scroll listener.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 4);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 h-[var(--header-height)] bg-[var(--color-background)]/90 backdrop-blur-md border-b border-[var(--color-border)] transition-shadow duration-200",
        scrolled ? "shadow-md" : "shadow-none",
      )}
    >
      <div className="h-full flex items-center justify-between gap-4 px-4 md:px-6">
        {/* ── Left cluster: hamburger + store name + desktop nav ── */}
        <div className="flex items-center gap-4 md:gap-8 min-w-0">
          {/* Hamburger — always visible */}
          <button
            type="button"
            onClick={toggleNav}
            aria-label="Otwórz menu"
            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] shrink-0"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Brand mark — logo (when present) + store name. The logo is
              intentionally kept small (height-only sizing) so the header
              stays a subtle brand strip rather than a banner. Left-aligned
              on desktop so nav links can sit beside it; on mobile the same
              cluster is absolutely centred (below) to keep the layout
              balanced around hamburger + cart. */}
          <div className="hidden md:flex items-center gap-2.5 min-w-0">
            {showLogo && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoUrl}
                alt={storeName}
                onError={() => setLogoBroken(true)}
                className="h-6 w-auto max-w-[140px] object-contain shrink-0"
                loading="eager"
                decoding="async"
                draggable={false}
              />
            )}
            <p className="font-extrabold text-[var(--color-text)] text-base tracking-tight uppercase truncate">
              {storeName}
            </p>
          </div>

          {/* Desktop inline nav */}
          <HeaderNavLinks />
        </div>

        {/* ── Mobile centre: logo + store name absolutely positioned ── */}
        <div className="md:hidden absolute left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-2 max-w-[60vw]">
          {showLogo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoUrl}
              alt=""
              onError={() => setLogoBroken(true)}
              className="h-5 w-auto max-w-[96px] object-contain shrink-0"
              loading="eager"
              decoding="async"
              draggable={false}
              aria-hidden="true"
            />
          )}
          <p className="font-extrabold text-[var(--color-text)] text-sm tracking-tight uppercase truncate">
            {storeName}
          </p>
        </div>

        {/* ── Right: cart ── */}
        <button
          type="button"
          onClick={toggleCart}
          aria-label={`Otwórz koszyk${cartCount > 0 ? ` (${cartCount})` : ""}`}
          className="relative w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] shrink-0"
        >
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.5l.44 2m0 0L6 14.25h11.5l1.5-7.5H4.19zM6 20.25a1.125 1.125 0 102.25 0 1.125 1.125 0 00-2.25 0zm9 0a1.125 1.125 0 102.25 0 1.125 1.125 0 00-2.25 0z"
            />
          </svg>
          {cartCount > 0 && (
            /* Key on cartCount remounts the span so the cart-bump animation
               fires every time the count changes — even when the previous
               animation has not yet finished. */
            <span
              key={cartCount}
              className="cart-bump absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-accent)] text-white text-[10px] font-bold flex items-center justify-center"
            >
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
