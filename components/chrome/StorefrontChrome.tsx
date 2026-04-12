"use client";

import AnnouncementStrip from "./AnnouncementStrip";
import StorefrontHeader from "./StorefrontHeader";
import HeaderCtaStrip from "./HeaderCtaStrip";
import NavigationDrawer from "./NavigationDrawer";
import CartDrawer from "./CartDrawer";
import Toast from "./Toast";
import type { BrandingConfig } from "@/types/storefront";

interface StorefrontChromeProps {
  branding: BrandingConfig;
  announcementItems: string[];
  /** Optional label override for the secondary CTA strip. */
  headerCtaLabel?: string;
  /** Checkout href used by the cart drawer as a fallback. */
  checkoutUrl: string;
  /**
   * Pipeline session ID (STORE_ID env var) forwarded from the server layout.
   * When present, CartDrawer uses the async handoff bridge instead of a
   * direct redirect. Absent in local dev / preview without env vars.
   */
  storeId?: string;
  /** Backend API base URL forwarded from the server layout. */
  apiUrl?: string;
  /**
   * Explicit handoff endpoint URL from `commerce.pluginHandoffUrl`.
   * When present, the cart bridge uses this URL instead of constructing
   * one from `apiUrl + storeId`.
   */
  pluginHandoffUrl?: string | null;
}

/**
 * Mounts the full global chrome above the page body:
 *
 *   [AnnouncementStrip]  — scrolls with the page
 *   [StorefrontHeader]   — sticky
 *   [HeaderCtaStrip]     — sticky under the header (conversion lever)
 *   [NavigationDrawer]   — left overlay
 *   [CartDrawer]         — right overlay
 *   [Toast]              — top-right, ephemeral
 *
 * The whole stack is a single client island so the storefront layout
 * itself can stay an async server component.
 */
export default function StorefrontChrome({
  branding,
  announcementItems,
  headerCtaLabel,
  checkoutUrl,
  storeId,
  apiUrl,
  pluginHandoffUrl,
}: StorefrontChromeProps) {
  return (
    <>
      <AnnouncementStrip items={announcementItems} />
      <StorefrontHeader storeName={branding.storeName} />
      <HeaderCtaStrip label={headerCtaLabel} />
      <NavigationDrawer branding={branding} />
      <CartDrawer
        checkoutUrl={checkoutUrl}
        storeId={storeId}
        apiUrl={apiUrl}
        pluginHandoffUrl={pluginHandoffUrl}
      />
      <Toast />
    </>
  );
}
