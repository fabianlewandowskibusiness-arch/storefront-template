"use client";

import { useCallback, useState } from "react";
import { trackBeginCheckout } from "@/lib/analytics/tracking";
import { joinApiUrl } from "@/lib/url";
import {
  selectCartIsEmpty,
  selectCartSubtotal,
  selectCartCurrency,
  useUiStore,
  type CartItem,
} from "@/lib/stores/uiStore";
import type { CartHandoffLine, CartHandoffRequest, CartHandoffResponse } from "@/lib/commerce/types";

// ── Options ──────────────────────────────────────────────────────────────────

interface UseCheckoutOptions {
  /**
   * Dev-only fallback URL. Used ONLY when `NODE_ENV === "development"` and
   * the plugin bridge is not configured. In production this field is never
   * read — the hook produces an error state instead.
   */
  devFallbackUrl: string;
  /**
   * Pipeline session ID (STORE_ID env var). Required for bridge mode.
   */
  storeId?: string;
  /** Backend API base URL. Used to construct the handoff endpoint when
   *  `pluginHandoffUrl` is not explicitly provided. */
  apiUrl?: string;
  /**
   * Explicit handoff endpoint URL from `commerce.pluginHandoffUrl`.
   * When present, takes priority over the constructed `apiUrl + storeId` URL.
   */
  pluginHandoffUrl?: string | null;
  /** Target hint sent to backend (CART or CHECKOUT). */
  target?: CartHandoffRequest["target"];
}

// ── Result ────────────────────────────────────────────────────────────────────

interface UseCheckoutResult {
  /** True while the checkout redirect is in progress. */
  isSubmitting: boolean;
  /** True when the cart has no items. */
  isEmpty: boolean;
  /**
   * True when a valid handoff endpoint is resolvable from the provided config.
   * When false, checkout is blocked and `handleCheckout` will set an error
   * instead of redirecting.
   */
  bridgeConfigured: boolean;
  /** Non-null when the handoff failed or bridge is not configured. */
  handoffError: string | null;
  /** Clears the handoff error so the user can retry. */
  clearHandoffError: () => void;
  /** Invokes checkout via the plugin bridge. */
  handleCheckout: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const HANDOFF_TIMEOUT_MS = 5_000;

const NOT_CONFIGURED_ERROR =
  "Checkout niedostępny — integracja WooCommerce nie jest skonfigurowana. Skontaktuj się z administratorem sklepu.";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toHandoffLines(items: CartItem[]): CartHandoffLine[] {
  return items.map((item) => ({
    productId: item.productId,
    variationId: item.variantId,
    quantity: item.quantity,
  }));
}

async function fetchHandoff(
  handoffUrl: string,
  body: CartHandoffRequest,
): Promise<{ ok: true; checkoutUrl: string } | { ok: false; error: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HANDOFF_TIMEOUT_MS);

  try {
    const res = await fetch(handoffUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const errBody = await res.json();
        if (errBody?.message) detail = errBody.message;
      } catch {
        // ignore JSON parse error
      }
      return { ok: false, error: detail };
    }

    const data: CartHandoffResponse = await res.json();

    // `checkoutUrl` is the primary field (plugin ≥ v1.1.0).
    // `redirectUrl` is the legacy alias kept for backward compatibility with plugin < v1.1.0.
    const resolvedUrl = data.checkoutUrl ?? data.redirectUrl;

    if (!resolvedUrl) {
      const keys = Object.keys(data as object).join(", ") || "(empty)";
      return {
        ok: false,
        error: `Handoff succeeded but no redirect URL was returned. Response keys: ${keys}`,
      };
    }

    return { ok: true, checkoutUrl: resolvedUrl };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: "Checkout timed out. Please try again." };
    }
    return { ok: false, error: "Could not connect to checkout service. Please try again." };
  } finally {
    clearTimeout(timer);
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Checkout handler — WooCommerce Cart Bridge plugin is the ONLY supported
 * commerce handoff mode.
 *
 * When the bridge is configured (`pluginHandoffUrl` or `apiUrl + storeId`):
 *   - POSTs real cart lines to the handoff endpoint
 *   - Redirects to the returned WooCommerce URL on success
 *   - Shows an explicit error on failure — no silent fallback
 *
 * When the bridge is NOT configured:
 *   - `bridgeConfigured` is `false`
 *   - `handleCheckout()` immediately sets `handoffError`
 *   - The cart drawer should show a "not configured" banner and disable the
 *     checkout button
 *   - In development mode only (`NODE_ENV === "development"`), a console
 *     warning is emitted and the `devFallbackUrl` redirect is used so local
 *     testing is not blocked
 */
export function useCheckout({
  devFallbackUrl,
  storeId,
  apiUrl = "",
  pluginHandoffUrl,
  target,
}: UseCheckoutOptions): UseCheckoutResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [handoffError, setHandoffError] = useState<string | null>(null);

  const isEmpty = useUiStore(selectCartIsEmpty);
  const cartItems = useUiStore((s) => s.cartItems);
  const subtotal = useUiStore(selectCartSubtotal);
  const currency = useUiStore(selectCartCurrency);

  const clearHandoffError = useCallback(() => setHandoffError(null), []);

  // ── Bridge detection ──
  // The bridge is configured when we can resolve a handoff URL: either an
  // explicit `pluginHandoffUrl` from the runtime config, or `apiUrl + storeId`
  // to construct one.
  const bridgeConfigured = !!storeId && !!(pluginHandoffUrl || apiUrl);

  const handleCheckout = useCallback(() => {
    if (isEmpty || isSubmitting) return;

    setHandoffError(null);
    trackBeginCheckout(undefined, subtotal, currency);

    if (typeof window === "undefined") return;

    // ── Bridge not configured ──
    if (!bridgeConfigured) {
      // Dev-only escape hatch: allow a URL redirect so local `npm run dev`
      // without env vars is not completely blocked. Never fires in production.
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[useCheckout] Bridge not configured — using dev-only fallback redirect.",
          "Set STORE_ID + STOREFRONT_API_URL or pluginHandoffUrl to enable real checkout.",
        );
        setIsSubmitting(true);
        window.location.href = devFallbackUrl;
        return;
      }

      // Production: block checkout with a clear error.
      setHandoffError(NOT_CONFIGURED_ERROR);
      return;
    }

    // ── Full bridge mode ──
    setIsSubmitting(true);

    const handoffUrl =
      pluginHandoffUrl ||
      joinApiUrl(apiUrl, `/api/storefront-runtime/${storeId}/commerce/handoff`);

    const body: CartHandoffRequest = {
      lines: toHandoffLines(cartItems),
      target,
    };

    fetchHandoff(handoffUrl, body).then((result) => {
      if (result.ok) {
        window.location.href = result.checkoutUrl;
      } else {
        setIsSubmitting(false);
        setHandoffError(result.error);
      }
    });
  }, [devFallbackUrl, storeId, apiUrl, pluginHandoffUrl, bridgeConfigured, target, isEmpty, isSubmitting, cartItems, subtotal, currency]);

  return { isSubmitting, isEmpty, bridgeConfigured, handoffError, clearHandoffError, handleCheckout };
}
