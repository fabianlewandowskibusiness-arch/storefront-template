export type AnalyticsEvent =
  | { name: "page_view"; properties?: Record<string, string> }
  | { name: "hero_cta_click"; properties?: { label: string; href?: string } }
  | { name: "offer_cta_click"; properties?: { label: string; productId?: string } }
  | { name: "final_cta_click"; properties?: { label: string } }
  | { name: "faq_open"; properties?: { question: string } }
  | { name: "begin_checkout"; properties?: { productId?: string; price?: number; currency?: string } };
