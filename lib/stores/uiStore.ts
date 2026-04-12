"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ── Cart model ────────────────────────────────────────────────────────────────
//
// `id` is the authoritative line key used for deduping inside the store.
// `productId` / `variantId` are optional fields reserved for future backend
// integration — once a real commerce layer exists, line merging will look
// them up, but for now they travel alongside the line without being used.

export interface CartItem {
  id: string;
  productId?: string;
  variantId?: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  image?: string;
  comparePrice?: number;
}

// Hard cap per line. Keeps the UI reasonable and matches the brief.
export const MAX_QTY = 10;

// ── Toast ─────────────────────────────────────────────────────────────────────

export type ToastTone = "success" | "error" | "info";

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

// ── Persisted slice ───────────────────────────────────────────────────────────
//
// Only `cartItems` survives a page refresh. UI state (drawers, toast) is
// deliberately ephemeral — opening a page with the cart drawer already
// open would be wrong.

interface PersistedState {
  cartItems: CartItem[];
}

// ── Full UI state ─────────────────────────────────────────────────────────────

interface UiState extends PersistedState {
  // ── Drawers ──
  navOpen: boolean;
  cartOpen: boolean;
  openNav: () => void;
  closeNav: () => void;
  toggleNav: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  closeAll: () => void;

  // ── Cart mutations ──
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  /** Change quantity by a delta. Clamped to [0, MAX_QTY]; 0 removes. */
  updateQty: (id: string, delta: number) => void;
  /** Set quantity absolutely. Clamped to [0, MAX_QTY]; 0 removes. */
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;

  // ── Toast ──
  toast: ToastState | null;
  showToast: (message: string, tone?: ToastTone) => void;
  clearToast: () => void;
}

let toastId = 0;

// Clamp helper shared by setQty / updateQty / addToCart.
function clampQty(q: number): number {
  if (q < 0) return 0;
  if (q > MAX_QTY) return MAX_QTY;
  return q;
}

// ── Store ─────────────────────────────────────────────────────────────────────
//
// The creator is wrapped in `persist` so cart state survives refresh.
// `partialize` filters the persisted snapshot to cart fields only.
// `version` + `migrate` provide a basic upgrade path: any persisted
// state with a different version is discarded, not silently coerced.

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      // ── Drawers ──
      navOpen: false,
      cartOpen: false,
      openNav: () => set({ navOpen: true, cartOpen: false }),
      closeNav: () => set({ navOpen: false }),
      toggleNav: () => set((s) => ({ navOpen: !s.navOpen, cartOpen: false })),
      openCart: () => set({ cartOpen: true, navOpen: false }),
      closeCart: () => set({ cartOpen: false }),
      toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen, navOpen: false })),
      closeAll: () => set({ navOpen: false, cartOpen: false }),

      // ── Cart ──
      cartItems: [],
      addToCart: (item) => {
        const requested = item.quantity ?? 1;
        const existing = get().cartItems.find((i) => i.id === item.id);

        if (existing) {
          const nextQty = clampQty(existing.quantity + requested);
          // If the cap was hit, notify the user so the "stuck + button"
          // has a visible explanation.
          if (nextQty === MAX_QTY && existing.quantity + requested > MAX_QTY) {
            get().showToast(`Maksymalna ilość: ${MAX_QTY}`, "info");
          }
          set({
            cartItems: get().cartItems.map((i) =>
              i.id === item.id ? { ...i, quantity: nextQty } : i,
            ),
          });
          return;
        }

        const nextQty = clampQty(requested);
        if (nextQty === 0) return;
        set({
          cartItems: [...get().cartItems, { ...item, quantity: nextQty }],
        });
      },
      removeFromCart: (id) => {
        set({ cartItems: get().cartItems.filter((i) => i.id !== id) });
      },
      updateQty: (id, delta) => {
        const item = get().cartItems.find((i) => i.id === id);
        if (!item) return;
        get().setQty(id, item.quantity + delta);
      },
      setQty: (id, qty) => {
        const nextQty = clampQty(qty);
        if (nextQty === 0) {
          get().removeFromCart(id);
          return;
        }
        // Warn when the cap is hit via direct set.
        const current = get().cartItems.find((i) => i.id === id);
        if (current && qty > MAX_QTY && current.quantity < MAX_QTY) {
          get().showToast(`Maksymalna ilość: ${MAX_QTY}`, "info");
        }
        set({
          cartItems: get().cartItems.map((i) =>
            i.id === id ? { ...i, quantity: nextQty } : i,
          ),
        });
      },
      clearCart: () => set({ cartItems: [] }),

      // ── Toast ──
      toast: null,
      showToast: (message, tone = "success") => {
        set({ toast: { id: ++toastId, message, tone } });
      },
      clearToast: () => set({ toast: null }),
    }),
    {
      name: "storefront-cart",
      version: 1,
      // Only persist cart-related state — never drawer/toast visibility.
      partialize: (state): PersistedState => ({ cartItems: state.cartItems }),
      // createJSONStorage handles SSR: the factory is only invoked client-side,
      // so there is no window access during server rendering.
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          // SSR fallback — no-op storage.
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
      // Basic version migration: any persisted snapshot that does not match
      // the current version is discarded. Good enough for MVP — once real
      // commerce ships, we can add a proper migration function here.
      migrate: (persistedState: unknown, version: number) => {
        if (version !== 1) {
          return { cartItems: [] } as PersistedState;
        }
        return persistedState as PersistedState;
      },
    },
  ),
);

// ── Derived selectors ─────────────────────────────────────────────────────────

/** Total quantity across all line items. */
export const selectCartCount = (state: UiState): number =>
  state.cartItems.reduce((n, i) => n + i.quantity, 0);

/** Subtotal across all line items (sum of price × quantity). */
export const selectCartSubtotal = (state: UiState): number =>
  state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

/** Currency to display in the cart summary. Assumes single-currency store. */
export const selectCartCurrency = (state: UiState): string =>
  state.cartItems[0]?.currency ?? "PLN";

/** True when the cart has no items. Useful for disabling the checkout button. */
export const selectCartIsEmpty = (state: UiState): boolean =>
  state.cartItems.length === 0;
