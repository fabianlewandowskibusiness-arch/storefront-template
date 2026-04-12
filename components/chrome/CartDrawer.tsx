"use client";

import {
  useUiStore,
  selectCartSubtotal,
  selectCartCount,
  selectCartCurrency,
  MAX_QTY,
  type CartItem,
} from "@/lib/stores/uiStore";
import { useCheckout } from "@/lib/hooks/useCheckout";
import Drawer from "./Drawer";
import { formatPrice } from "@/lib/utils/formatPrice";

interface CartDrawerProps {
  /** Dev-only fallback URL — used only in `NODE_ENV=development`. */
  checkoutUrl: string;
  /** Pipeline session ID (STORE_ID). */
  storeId?: string;
  /** Backend API base URL. */
  apiUrl?: string;
  /** Explicit handoff URL from commerce.pluginHandoffUrl. */
  pluginHandoffUrl?: string | null;
}

export default function CartDrawer({ checkoutUrl, storeId, apiUrl, pluginHandoffUrl }: CartDrawerProps) {
  const open = useUiStore((s) => s.cartOpen);
  const closeCart = useUiStore((s) => s.closeCart);
  const cartItems = useUiStore((s) => s.cartItems);
  const subtotal = useUiStore(selectCartSubtotal);
  const count = useUiStore(selectCartCount);
  const currency = useUiStore(selectCartCurrency);
  const removeFromCart = useUiStore((s) => s.removeFromCart);
  const updateQty = useUiStore((s) => s.updateQty);
  const showToast = useUiStore((s) => s.showToast);

  const {
    isSubmitting,
    isEmpty,
    bridgeConfigured,
    handoffError,
    clearHandoffError,
    handleCheckout,
  } = useCheckout({
    devFallbackUrl: checkoutUrl,
    storeId,
    apiUrl,
    pluginHandoffUrl,
  });

  function handleRemove(item: CartItem) {
    removeFromCart(item.id);
    showToast("Usunięto z koszyka", "info");
  }

  // Checkout is disabled when:
  //  1. cart is empty
  //  2. handoff is already in flight
  //  3. bridge is not configured (production — the banner below explains why)
  const checkoutDisabled = isEmpty || isSubmitting || !bridgeConfigured;

  return (
    <Drawer open={open} onClose={closeCart} side="right" title="Koszyk">
      <div className="flex flex-col h-full">
        {isEmpty ? (
          <EmptyState onContinue={closeCart} />
        ) : (
          <>
            {/* Item list */}
            <div className="reveal is-visible flex-1 overflow-y-auto divide-y divide-[var(--color-border)]">
              {cartItems.map((item) => (
                <CartLine
                  key={item.id}
                  item={item}
                  onRemove={() => handleRemove(item)}
                  onInc={() => updateQty(item.id, 1)}
                  onDec={() => updateQty(item.id, -1)}
                />
              ))}
            </div>

            {/* Totals + CTAs */}
            <div className="px-5 py-5 border-t border-[var(--color-border)] space-y-3">
              {/* ── Commerce not configured — info banner ── */}
              {!bridgeConfigured && (
                <div
                  role="status"
                  className="flex items-start gap-2.5 rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800"
                >
                  <svg
                    className="shrink-0 w-4 h-4 mt-0.5 text-amber-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                    />
                  </svg>
                  <span className="flex-1 leading-relaxed">
                    Checkout niedostępny — integracja WooCommerce nie jest skonfigurowana.
                  </span>
                </div>
              )}

              {/* ── Handoff runtime error — red banner ── */}
              {handoffError && bridgeConfigured && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-md bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-700"
                >
                  <svg
                    className="shrink-0 w-4 h-4 mt-0.5 text-red-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                    />
                  </svg>
                  <span className="flex-1">{handoffError}</span>
                  <button
                    type="button"
                    onClick={clearHandoffError}
                    aria-label="Zamknij błąd"
                    className="shrink-0 text-red-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                <span>
                  Pozycje: <span className="font-semibold tabular-nums">{count}</span>
                </span>
                <span>Podatki i dostawa w następnym kroku</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-text-muted)]">Suma częściowa</span>
                <span className="font-extrabold text-base text-[var(--color-text)] tabular-nums">
                  {formatPrice(subtotal, currency)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkoutDisabled}
                className="block w-full text-center rounded-[var(--radius)] bg-[var(--color-accent)] text-white font-semibold text-sm py-3.5 transition-all hover:brightness-110 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? "Przekierowanie…" : "Przejdź do checkoutu"}
              </button>
              <button
                type="button"
                onClick={closeCart}
                className="w-full rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--color-text)] font-semibold text-sm py-3 transition-colors hover:bg-[var(--color-surface)]"
              >
                Kontynuuj zakupy
              </button>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-[var(--color-surface)] flex items-center justify-center mb-5">
          <svg
            className="w-10 h-10 text-[var(--color-text-muted)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.5l.44 2m0 0L6 14.25h11.5l1.5-7.5H4.19zM6 20.25a1.125 1.125 0 102.25 0 1.125 1.125 0 00-2.25 0zm9 0a1.125 1.125 0 102.25 0 1.125 1.125 0 00-2.25 0z"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-[var(--color-text)] mb-2">
          Twój koszyk jest pusty
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed max-w-[220px]">
          Dodaj produkt, by rozpocząć zakupy. Dostawa od 0 zł, 30 dni na zwrot.
        </p>
      </div>
      <div className="px-5 py-4 border-t border-[var(--color-border)]">
        <button
          type="button"
          onClick={onContinue}
          className="w-full rounded-[var(--radius)] bg-[var(--color-accent)] text-white font-semibold text-sm py-3 transition-all hover:brightness-110 active:scale-[0.99]"
        >
          Kontynuuj zakupy
        </button>
      </div>
    </div>
  );
}

// ── Line item ────────────────────────────────────────────────────────────────

interface CartLineProps {
  item: CartItem;
  onRemove: () => void;
  onInc: () => void;
  onDec: () => void;
}

function CartLine({ item, onRemove, onInc, onDec }: CartLineProps) {
  const lineTotal = item.price * item.quantity;
  const compareLineTotal = item.comparePrice
    ? item.comparePrice * item.quantity
    : undefined;
  const hasDiscount = compareLineTotal && compareLineTotal > lineTotal;
  const atMax = item.quantity >= MAX_QTY;

  return (
    <div className="px-5 py-5 flex gap-4">
      <div className="shrink-0 w-16 h-16 rounded-md overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)]">
        {item.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm text-[var(--color-text)] leading-snug line-clamp-2">
            {item.name}
          </p>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Usuń z koszyka"
            className="shrink-0 -mt-0.5 -mr-1 w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mt-1 text-[11px] text-[var(--color-text-muted)] tabular-nums">
          {formatPrice(item.price, item.currency)} / szt.
        </p>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center border border-[var(--color-border)] rounded-md overflow-hidden">
            <button
              type="button"
              onClick={onDec}
              aria-label="Zmniejsz ilość"
              className="w-7 h-7 flex items-center justify-center text-sm font-bold text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors"
            >
              −
            </button>
            <span className="w-7 text-center text-xs font-semibold text-[var(--color-text)] tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={onInc}
              disabled={atMax}
              aria-label="Zwiększ ilość"
              className="w-7 h-7 flex items-center justify-center text-sm font-bold text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              +
            </button>
          </div>

          <div className="text-right">
            <p className="font-bold text-sm text-[var(--color-text)] tabular-nums">
              {formatPrice(lineTotal, item.currency)}
            </p>
            {hasDiscount && (
              <p className="text-[11px] text-[var(--color-text-muted)] line-through tabular-nums">
                {formatPrice(compareLineTotal, item.currency)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
