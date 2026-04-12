"use client";

import { useEffect, useState } from "react";

interface SocialProofBadgeProps {
  /** Range of "viewers right now" count. */
  viewersMin?: number;
  viewersMax?: number;
  /** Static "purchased in last hour" number. */
  recentPurchases?: number;
  /** Messages rotate every N milliseconds. */
  rotateMs?: number;
}

/**
 * Subtle, client-only social-proof line that rotates between two states:
 *   🔥 X osób ogląda teraz
 *   🛒 Y osób kupiło w ostatniej godzinie
 *
 * The viewer count drifts by ±1 every ~7 s so it feels alive without
 * being absurdly volatile. Numbers are rendered purely client-side after
 * mount — nothing is committed server-side, so there is no hydration
 * mismatch and no SEO footprint.
 */
export default function SocialProofBadge({
  viewersMin = 18,
  viewersMax = 34,
  recentPurchases = 12,
  rotateMs = 6000,
}: SocialProofBadgeProps) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<0 | 1>(0);
  const [viewers, setViewers] = useState(() =>
    Math.round((viewersMin + viewersMax) / 2),
  );

  useEffect(() => {
    setMounted(true);
    // Randomize initial viewer count client-side only (no SSR mismatch).
    setViewers(
      Math.floor(Math.random() * (viewersMax - viewersMin + 1)) + viewersMin,
    );
  }, [viewersMin, viewersMax]);

  // Rotate between the two messages.
  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => {
      setPhase((p) => (p === 0 ? 1 : 0));
    }, rotateMs);
    return () => clearInterval(id);
  }, [mounted, rotateMs]);

  // Drift the viewer count slightly every ~7s for a live feel.
  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => {
      setViewers((v) => {
        const delta = Math.random() < 0.5 ? -1 : 1;
        const next = v + delta;
        if (next < viewersMin) return viewersMin;
        if (next > viewersMax) return viewersMax;
        return next;
      });
    }, 7000);
    return () => clearInterval(id);
  }, [mounted, viewersMin, viewersMax]);

  if (!mounted) return null;

  const message =
    phase === 0
      ? { icon: "🔥", text: `${viewers} osób ogląda teraz` }
      : { icon: "🛒", text: `${recentPurchases} osób kupiło w ostatniej godzinie` };

  return (
    <p
      key={phase}
      className="proof-in text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-1.5"
      aria-live="polite"
    >
      <span aria-hidden="true">{message.icon}</span>
      <span>{message.text}</span>
    </p>
  );
}
