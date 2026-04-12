"use client";

import { useInView } from "@/lib/hooks/useInView";
import { cn } from "@/lib/utils/cn";

interface RevealProps {
  children: React.ReactNode;
  /** Stagger index — multiplied by 80 ms per item for child sequencing. */
  index?: number;
  /** Custom delay in ms. Overrides `index`. */
  delayMs?: number;
  className?: string;
}

/**
 * Wraps any content in a fade + slide-up reveal that triggers when the
 * element first enters the viewport. Uses IntersectionObserver via
 * useInView — zero animation libraries.
 *
 * Always renders a <div>. If a different container tag is needed, wrap
 * your element inside Reveal rather than making Reveal polymorphic.
 */
export default function Reveal({
  children,
  index = 0,
  delayMs,
  className,
}: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const delay = delayMs ?? index * 80;
  const style = delay > 0 ? { transitionDelay: `${delay}ms` } : undefined;

  return (
    <div
      ref={ref}
      className={cn("reveal", inView && "is-visible", className)}
      style={style}
    >
      {children}
    </div>
  );
}
