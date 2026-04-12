"use client";

import { useState, useRef, useEffect } from "react";
import type { GalleryItem } from "@/types/storefront";

interface ImageGalleryProps {
  items: GalleryItem[];
  productName: string;
}

export default function ImageGallery({ items, productName }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  function selectIndex(i: number) {
    setActiveIndex(i);
    const target = itemRefs.current[i];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    }
  }

  // Track which slide is in view (mobile swipe support).
  useEffect(() => {
    if (!scrollerRef.current) return;
    const root = scrollerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = itemRefs.current.indexOf(entry.target as HTMLDivElement);
            if (idx >= 0) setActiveIndex(idx);
          }
        }
      },
      { root, threshold: 0.55 },
    );
    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div className="w-full">
      {/* Main scrollable area — horizontal swipe on mobile, click thumbnails on desktop */}
      <div
        ref={scrollerRef}
        className="relative w-full overflow-x-auto snap-x snap-mandatory scroll-smooth flex rounded-[var(--radius)] bg-[var(--color-surface)] no-scrollbar"
      >
        {items.map((item, i) => (
          <div
            key={i}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className="snap-start shrink-0 w-full aspect-square relative"
          >
            {item.type === "video" ? (
              <video
                src={item.url}
                controls
                className="w-full h-full object-cover"
                playsInline
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={item.url}
                alt={item.alt || productName}
                className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                  i === activeIndex ? "scale-[1.02] gallery-fade" : "scale-100"
                }`}
                loading={i === 0 ? "eager" : "lazy"}
              />
            )}
          </div>
        ))}

        {/* Page indicator dots — visible on mobile only */}
        {items.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
            {items.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === activeIndex
                    ? "bg-[var(--color-accent)]"
                    : "bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails row — visible on tablet and up */}
      {items.length > 1 && (
        <div className="hidden md:flex mt-3 gap-2 overflow-x-auto no-scrollbar">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectIndex(i)}
              className={`shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                i === activeIndex
                  ? "border-[var(--color-accent)]"
                  : "border-[var(--color-border)] hover:border-[var(--color-accent)]/50"
              }`}
              aria-label={`Pokaż zdjęcie ${i + 1}`}
            >
              {item.type === "video" ? (
                <div className="w-full h-full bg-black flex items-center justify-center text-white text-lg">
                  ▶
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.url}
                  alt={item.alt || ""}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
