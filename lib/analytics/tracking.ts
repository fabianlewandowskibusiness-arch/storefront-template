import type { AnalyticsEvent } from "./events";

let analyticsEnabled = false;

export function initAnalytics(enabled: boolean) {
  analyticsEnabled = enabled;
}

export function trackEvent(event: AnalyticsEvent) {
  if (!analyticsEnabled) return;

  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("[analytics]", event.name, event.properties ?? {});
  }

  // Future: dispatch to Vercel Analytics, GTM, or custom endpoint
  if (typeof window !== "undefined") {
    const w = window as unknown as Record<string, unknown>;
    if (typeof w.__analytics_handler === "function") {
      (w.__analytics_handler as (e: AnalyticsEvent) => void)(event);
    }
  }
}

export function trackPageView() {
  trackEvent({ name: "page_view" });
}

export function trackHeroCtaClick(label: string, href?: string) {
  trackEvent({ name: "hero_cta_click", properties: { label, href } });
}

export function trackOfferCtaClick(label: string, productId?: string) {
  trackEvent({ name: "offer_cta_click", properties: { label, productId } });
}

export function trackFaqOpen(question: string) {
  trackEvent({ name: "faq_open", properties: { question } });
}

export function trackFinalCtaClick(label: string) {
  trackEvent({ name: "final_cta_click", properties: { label } });
}

export function trackBeginCheckout(productId?: string, price?: number, currency?: string) {
  trackEvent({ name: "begin_checkout", properties: { productId, price, currency } });
}
