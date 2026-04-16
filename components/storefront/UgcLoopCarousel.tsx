"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import StarRating from "@/components/storefront/StarRating";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface UgcMedia {
  url: string;
  type: "image" | "video";
  poster?: string;
  alt?: string;
}

export interface UgcReview {
  id?: string;
  media: UgcMedia;
  quote: string;
  name: string;
  location?: string;
  rating?: number;
}

interface UgcLoopCarouselProps {
  reviews: UgcReview[];
  /** Auto-loop period in seconds. Default scales with card count. */
  durationSec?: number;
}

// ── Component ──────────────────────────────────────────────────────────────────
//
// Infinite looping carousel built on a duplicated CSS track:
//
//   [ viewport ]      — clips the visible window
//     [ .ugc-track ]  — flex row, animated translate-X 0 → -50%
//       [card 1] [card 2] … [card N] [card 1'] [card 2'] … [card N']
//
// The second half is a pixel copy of the first, so the wrap point is
// invisible.
//
// Pointer-drag layers on top: it sets `--ugc-offset` (a CSS custom prop)
// on the track to push it without restarting the animation. On pointerup
// we fold the offset modulo one copy's width so infinite drag stays
// bounded.
//
// Video management: only the card closest to the viewport centre
// auto-plays. Other videos stay paused to release decode budget.

export default function UgcLoopCarousel({
  reviews,
  durationSec,
}: UgcLoopCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // One ref slot per DOM card (we render each review TWICE).
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // ── Drag state ──
  const dragState = useRef<{
    active: boolean;
    startX: number;
    startOffset: number;
  }>({ active: false, startX: 0, startOffset: 0 });
  const offsetRef = useRef(0);

  // ── Reduced-motion detection ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // ── Pause when tab hidden (saves CPU + prevents drift) ──
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVis = () => {
      if (document.hidden) setPaused(true);
      else setPaused(false);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // ── Video management ──
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    if (reducedMotion) {
      videoRefs.current.forEach((v) => v?.pause());
      return;
    }

    let rafId = 0;
    const pickActiveVideo = () => {
      const vpRect = viewport.getBoundingClientRect();
      const centre = vpRect.left + vpRect.width / 2;

      let bestIdx = -1;
      let bestDist = Infinity;
      videoRefs.current.forEach((v, i) => {
        if (!v) return;
        const r = v.getBoundingClientRect();
        const mid = r.left + r.width / 2;
        const visible = r.right > vpRect.left && r.left < vpRect.right;
        if (!visible) return;
        const dist = Math.abs(mid - centre);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });

      videoRefs.current.forEach((v, i) => {
        if (!v) return;
        if (i === bestIdx) {
          v.play().catch(() => {
            /* Safari autoplay rejection — ignore */
          });
        } else if (!v.paused) {
          v.pause();
        }
      });
    };

    const schedule = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(pickActiveVideo);
    };

    const observer = new IntersectionObserver(schedule, {
      root: null,
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });
    cardRefs.current.forEach((el) => el && observer.observe(el));

    const onScroll = () => schedule();
    window.addEventListener("scroll", onScroll, { passive: true });
    schedule();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [reducedMotion, reviews.length]);

  // ── Drag handlers ──
  const applyOffset = useCallback((px: number) => {
    const track = trackRef.current;
    if (!track) return;
    const halfWidth = track.scrollWidth / 2;
    let o = px % halfWidth;
    if (o > 0) o -= halfWidth;
    offsetRef.current = o;
    track.style.setProperty("--ugc-offset", `${o}px`);
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    dragState.current = {
      active: true,
      startX: e.clientX,
      startOffset: offsetRef.current,
    };
    setPaused(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active) return;
    const dx = e.clientX - dragState.current.startX;
    applyOffset(dragState.current.startOffset + dx);
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active) return;
    dragState.current.active = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    setPaused(false);
  };

  // ── Loop duration — slower than before so the stream feels unhurried.
  //    8 s per unique card, clamped to [40, 140] seconds.
  const effectiveDuration =
    durationSec ?? Math.min(140, Math.max(40, reviews.length * 8));

  // Duplicate the list so the translate-50% loop is seamless.
  const doubled = [...reviews, ...reviews];

  if (reviews.length === 0) return null;

  // Reduced-motion mode: fall back to a native horizontal scroller.
  if (reducedMotion) {
    return (
      <div
        className="mx-auto max-w-[1400px] flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth px-6 md:px-10 edge-fade-x-wide"
        role="list"
      >
        {reviews.map((r, i) => (
          <Card key={r.id ?? i} review={r} roleListItem />
        ))}
      </div>
    );
  }

  // Viewport width is capped at 1400 px on large desktops so that roughly
  // 4 full cards remain visible at once. Below the cap (normal laptops,
  // tablets, mobile) the viewport stays at its natural width and the
  // carousel still fills the screen edge-to-edge.
  //
  // Maths: 4 cards × 300 px (lg) + 3 gaps × 12 px + 2 × 80 px edge fade
  //      = 1200 + 36 + 160 = 1396 px → rounded to 1400 px.
  return (
    <div
      ref={viewportRef}
      className={`ugc-viewport relative mx-auto max-w-[1400px] overflow-hidden edge-fade-x-wide ${
        paused ? "ugc-paused" : ""
      }`}
      aria-label="Opinie klientów"
    >
      <div
        ref={trackRef}
        className="ugc-track flex gap-3 w-max touch-pan-y select-none py-2"
        style={{
          ["--ugc-duration" as string]: `${effectiveDuration}s`,
          ["--ugc-offset" as string]: `${offsetRef.current}px`,
          cursor: "grab",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {doubled.map((review, i) => {
          const isCopy = i >= reviews.length;
          return (
            <div
              key={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="shrink-0"
              aria-hidden={isCopy ? "true" : undefined}
              data-copy={isCopy ? "true" : undefined}
            >
              <Card
                review={review}
                videoRef={(el) => {
                  videoRefs.current[i] = el;
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  review: UgcReview;
  videoRef?: (el: HTMLVideoElement | null) => void;
  roleListItem?: boolean;
}

function Card({ review, videoRef, roleListItem }: CardProps) {
  const { media, quote, name, location, rating } = review;
  const hasMedia = !!media.url;

  return (
    <figure
      role={roleListItem ? "listitem" : undefined}
      className="snap-start group flex flex-col w-[240px] sm:w-[260px] md:w-[280px] lg:w-[300px] xl:w-[320px] shrink-0 rounded-[var(--radius)] overflow-hidden bg-[var(--color-background)] border border-[var(--color-border)] shadow-[var(--shadow)] transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02] focus-within:ring-2 focus-within:ring-[var(--color-accent)]"
      tabIndex={-1}
    >
      {/* ── Media ── */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-surface)]">
        {hasMedia ? (
          media.type === "video" ? (
            <video
              ref={videoRef}
              src={media.url}
              poster={media.poster}
              muted
              loop
              playsInline
              preload="metadata"
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              aria-label={media.alt || `Opinia od ${name}`}
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={media.url}
              alt={media.alt || `Opinia od ${name}`}
              loading="lazy"
              draggable={false}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          )
        ) : (
          /* Missing-media fallback — rendered when `review.media.url` is
             empty, which maps to the canonical UGC `items[].imageUrl`
             field being `null` (see lib/storefront/mediaFields.ts).
             A branded gradient block with a pull-quote glyph keeps the
             card aspect ratio so the stream stays visually uniform even
             when a customer sent only text. */
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-accent-soft)] to-[var(--color-accent)]/20">
            <svg
              className="w-16 h-16 text-[var(--color-accent)] opacity-60"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
            </svg>
          </div>
        )}
      </div>

      {/* ── Body: quote + identity footer ── */}
      <figcaption className="flex flex-col flex-1 p-4">
        <blockquote className="text-sm text-[var(--color-text)] leading-relaxed line-clamp-4 flex-1">
          &ldquo;{quote}&rdquo;
        </blockquote>

        {/* Identity footer — name/location on the left, stars on the right */}
        <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-xs text-[var(--color-text)] truncate">
              {name}
            </p>
            {location && (
              <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                {location}
              </p>
            )}
          </div>
          {rating !== undefined && rating > 0 && (
            <div className="shrink-0">
              <StarRating rating={rating} showCount={false} size="sm" />
            </div>
          )}
        </div>
      </figcaption>
    </figure>
  );
}
