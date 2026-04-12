"use client";

import { useEffect } from "react";
import { useUiStore, type ToastTone } from "@/lib/stores/uiStore";

const TOAST_DURATION_MS = 2500;

/**
 * Single global toast surface. Subscribes to `uiStore.toast`; when a new
 * toast is pushed, it renders briefly in the top-right and auto-dismisses.
 * React's `key` on the wrapper re-triggers the entrance animation per
 * toast so rapid successive toasts still feel alive.
 *
 * No queue — the latest toast replaces the previous one. Matches Shopify
 * / Glossier behaviour where only the freshest message is shown.
 *
 * Tones: success (green), info (accent), error (red). Callers default
 * to "success".
 */
export default function Toast() {
  const toast = useUiStore((s) => s.toast);
  const clearToast = useUiStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(clearToast, TOAST_DURATION_MS);
    return () => clearTimeout(id);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div
      className="fixed top-[calc(var(--header-height)+12px)] right-4 z-[60] pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div
        key={toast.id}
        className="toast-in pointer-events-auto flex items-center gap-3 bg-[var(--color-text)] text-white text-sm font-medium px-4 py-3 rounded-[var(--radius)] shadow-2xl max-w-[320px]"
      >
        <ToastIcon tone={toast.tone} />
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

// ── Tone-aware icon ──────────────────────────────────────────────────────────

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === "error") {
    return (
      <svg
        className="w-5 h-5 text-red-400 shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (tone === "info") {
    return (
      <svg
        className="w-5 h-5 text-[var(--color-accent)] shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  // success
  return (
    <svg
      className="w-5 h-5 text-[var(--color-success)] shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}
