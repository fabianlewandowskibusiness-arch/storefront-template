"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side: "left" | "right";
  title: string;
  children: React.ReactNode;
}

/**
 * Reusable drawer primitive — backdrop, slide-in panel, ESC handler,
 * body scroll lock, and a lightweight focus sink so keyboard users land
 * inside the drawer when it opens. No animation library — pure CSS
 * transforms via `.drawer-panel` / `.drawer-backdrop` in globals.css.
 *
 * Not a full aria-modal implementation (no focus trap or tab cycling) —
 * just `role="dialog"` + `aria-modal="true"` + ESC + focus-on-open, which
 * covers the common case without shipping a 10KB a11y library.
 */
export default function Drawer({
  open,
  onClose,
  side,
  title,
  children,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while open (prevents background bleed on iOS drag)
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Move focus into the panel on open
  useEffect(() => {
    if (open) {
      // Defer until after the transition starts so the close button
      // is not still hidden behind the translate-x-full class.
      const id = requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  const hiddenTransform =
    side === "left" ? "-translate-x-full" : "translate-x-full";

  return (
    <>
      {/* Backdrop — always mounted so its fade transition runs on both
          enter and exit. pointer-events toggles on visibility. */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          "drawer-backdrop fixed inset-0 z-40 bg-black/50 backdrop-blur-sm",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!open}
        className={cn(
          "drawer-panel fixed top-0 bottom-0 z-50 flex flex-col bg-[var(--color-background)] shadow-2xl",
          "w-[85%] max-w-[320px]",
          side === "left" ? "left-0" : "right-0",
          open ? "translate-x-0" : hiddenTransform,
        )}
      >
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 px-5 h-[var(--header-height)] border-b border-[var(--color-border)] shrink-0">
          <h2 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wide">
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
    </>
  );
}
