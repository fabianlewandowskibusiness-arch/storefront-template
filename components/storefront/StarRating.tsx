"use client";

import { useEffect, useState } from "react";

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
  /** Enable a 1.2 s count-up animation on the review count. */
  animateCount?: boolean;
}

const SIZE_MAP: Record<string, string> = {
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

/**
 * Stars fade in on mount with a tiny stagger. When `animateCount` is on,
 * the review count counts up from 0 to the target — pure
 * requestAnimationFrame, no libraries. The animation is skipped entirely
 * if the user prefers reduced motion (handled globally by the CSS rule
 * on prefers-reduced-motion which sets animation/transition to 0.01 ms).
 */
export default function StarRating({
  rating,
  reviewCount,
  showCount = true,
  size = "md",
  animateCount = false,
}: StarRatingProps) {
  const filled = Math.round(rating);
  const star = SIZE_MAP[size];
  const [mounted, setMounted] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(
    animateCount && reviewCount ? 0 : reviewCount ?? 0,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!animateCount || !reviewCount || reviewCount <= 0) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setDisplayedCount(reviewCount);
      return;
    }

    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayedCount(Math.round(reviewCount * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animateCount, reviewCount]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5 text-[var(--color-warning)]">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className={`${star} ${i < filled ? "" : "opacity-25"} transition-opacity duration-500 ease-out`}
            style={{
              opacity: mounted ? (i < filled ? 1 : 0.25) : 0,
              transitionDelay: mounted ? `${i * 60}ms` : "0ms",
            }}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-sm font-semibold text-[var(--color-text)]">
        {rating.toFixed(1)}
      </span>
      {showCount && reviewCount !== undefined && reviewCount > 0 && (
        <span className="text-sm text-[var(--color-text-muted)] tabular-nums">
          ({displayedCount.toLocaleString("pl-PL")} opinii)
        </span>
      )}
    </div>
  );
}
