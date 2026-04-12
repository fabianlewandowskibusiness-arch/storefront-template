"use client";

import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
  /** Fire once and then stop observing. Default: true. */
  once?: boolean;
  /** IntersectionObserver threshold. Default: 0.15. */
  threshold?: number;
  /** Root margin — lets you trigger a bit before the element enters. */
  rootMargin?: string;
}

/**
 * Lightweight IntersectionObserver hook. Returns a ref to attach to any
 * element and a boolean indicating whether it has entered the viewport.
 *
 * One observer per call — no shared singleton. This is fine at our scale
 * (dozens of reveals per page) and keeps the hook dependency-free.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {},
): [React.RefObject<T | null>, boolean] {
  const { once = true, threshold = 0.15, rootMargin = "0px 0px -40px 0px" } = options;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // SSR fallback and older-browser fallback: mark as visible so content
    // never stays hidden because the observer never fired.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold, rootMargin]);

  return [ref, inView];
}
