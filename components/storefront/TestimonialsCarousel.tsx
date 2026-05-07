"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import StarRating from "@/components/storefront/StarRating";
import FramedImage from "@/components/ui/FramedImage";
import type { ImageFrame } from "@/types/storefront";

interface TestimonialItem {
  name: string;
  quote: string;
  avatar?: string;
  /** Presentation frame for avatar. Null = renderer defaults (cover). */
  avatarFrame?: ImageFrame | null;
  rating?: number;
  location?: string;
}

interface TestimonialsCarouselProps {
  items: TestimonialItem[];
  /** Auto-advance interval. Default: 5000 ms. Set 0 to disable. */
  intervalMs?: number;
}

/**
 * Horizontal, scroll-snap testimonials carousel with auto-advance.
 *
 *  • Scroll container = `overflow-x-auto snap-x snap-mandatory` so mobile
 *    swipe is 100% native. No touch event listeners, no custom drag.
 *  • `scrollTo({ left: n, behavior: "smooth" })` drives auto-advance
 *    and manual arrow navigation.
 *  • Active card is tracked via a scroll listener (for the dot indicator).
 *  • Auto-advance pauses on hover (desktop) and on pointerdown (mobile
 *    swipe) — resumes once the pointer is released.
 *  • Loops back to the first card when reaching the end.
 */
export default function TestimonialsCarousel({
  items,
  intervalMs = 5000,
}: TestimonialsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const target = scroller.children[index] as HTMLElement | undefined;
    if (!target) return;
    scroller.scrollTo({
      left: target.offsetLeft - scroller.offsetLeft,
      behavior: "smooth",
    });
  }, []);

  // Auto-advance.
  useEffect(() => {
    if (intervalMs <= 0 || items.length <= 1 || paused) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % items.length;
        goTo(next);
        return next;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, items.length, paused, goTo]);

  // Track active index from scroll position (manual swipe / arrow clicks).
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const children = Array.from(scroller.children) as HTMLElement[];
        const centre = scroller.scrollLeft + scroller.clientWidth / 2;
        let nearest = 0;
        let nearestDist = Infinity;
        for (let i = 0; i < children.length; i++) {
          const c = children[i];
          const mid = c.offsetLeft + c.offsetWidth / 2;
          const dist = Math.abs(mid - centre);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = i;
          }
        }
        setActiveIndex(nearest);
      });
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="relative max-w-5xl mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={() => setPaused(true)}
      onPointerUp={() => setPaused(false)}
      onPointerCancel={() => setPaused(false)}
    >
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth px-4 md:px-8 -mx-4 md:-mx-8 py-2"
      >
        {items.map((item, i) => {
          const isActive = i === activeIndex;
          return (
            <article
              key={i}
              className={`snap-center shrink-0 w-[85%] sm:w-[60%] md:w-[48%] lg:w-[44%] bg-[var(--color-background)] border rounded-[var(--radius)] p-6 transition-all duration-300 ${
                isActive
                  ? "border-[var(--color-accent)] shadow-lg scale-100"
                  : "border-[var(--color-border)] shadow-[var(--shadow)] scale-[0.97] opacity-80"
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                {/* Missing-media fallback: `item.avatar` maps to the canonical
                    `testimonials[].avatarUrl` field, which may be `null` per
                    the storefront media contract (see lib/storefront/mediaFields.ts).
                    When absent we render an initial-letter circle using the
                    author's name — same accent-soft tokens as the avatar slot. */}
                {item.avatar ? (
                  <FramedImage
                    src={item.avatar}
                    alt={item.name}
                    frame={item.avatarFrame}
                    className="w-14 h-14 rounded-full shrink-0 bg-[var(--color-accent-soft)]"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="w-14 h-14 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent)] font-bold text-lg"
                  >
                    {item.name.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base text-[var(--color-text)]">
                    {item.name}
                  </p>
                  {item.location && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {item.location}
                    </p>
                  )}
                  <div className="mt-1">
                    <StarRating
                      rating={item.rating ?? 5}
                      showCount={false}
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              <p className="text-sm md:text-base text-[var(--color-text)] leading-relaxed">
                &ldquo;{item.quote}&rdquo;
              </p>
            </article>
          );
        })}
      </div>

      {/* Dot indicator */}
      {items.length > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setActiveIndex(i);
                goTo(i);
              }}
              aria-label={`Pokaż opinię ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === activeIndex
                  ? "w-6 bg-[var(--color-accent)]"
                  : "w-2 bg-[var(--color-border)] hover:bg-[var(--color-accent)]/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
