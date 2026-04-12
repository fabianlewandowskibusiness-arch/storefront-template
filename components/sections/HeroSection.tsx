"use client";

import { useRef, useState, type MouseEvent } from "react";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import ImageGallery from "@/components/storefront/ImageGallery";
import PackageSelector from "@/components/storefront/PackageSelector";
import StarRating from "@/components/storefront/StarRating";
import SocialProofBadge from "@/components/storefront/SocialProofBadge";
import MobileBuyBar from "@/components/storefront/MobileBuyBar";
import { formatPrice } from "@/lib/utils/formatPrice";
import { trackHeroCtaClick, trackBeginCheckout } from "@/lib/analytics/tracking";
import { useUiStore } from "@/lib/stores/uiStore";
import type { GalleryItem, HeroPackage } from "@/types/storefront";

interface HeroSectionProps {
  headline: string;
  subheadline?: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  bullets: string[];
  trustBadge?: string;
  riskReversal?: string;
  deliveryInfo?: string;
  paymentInfo?: string;
  gallery: GalleryItem[];
  packages: HeroPackage[];
  fallbackCheckoutUrl: string;
  fallbackCtaLabel: string;
  currency: string;
  productName: string;
}

export default function HeroSection({
  headline,
  subheadline,
  description,
  rating,
  reviewCount,
  bullets,
  trustBadge,
  riskReversal,
  deliveryInfo,
  paymentInfo,
  gallery,
  packages,
  fallbackCheckoutUrl,
  fallbackCtaLabel,
  currency,
  productName,
}: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const addToCart = useUiStore((s) => s.addToCart);
  const openCart = useUiStore((s) => s.openCart);
  const showToast = useUiStore((s) => s.showToast);

  // Default selection: bestseller package, otherwise the first one.
  const initialId =
    packages.find((p) => p.isBestseller)?.id ?? packages[0]?.id ?? "";
  const [selectedId, setSelectedId] = useState(initialId);
  const selectedPkg = packages.find((p) => p.id === selectedId);

  // CTA resolution: per-package URL beats the global checkout URL.
  // CTA label includes the live price of the selected package.
  const ctaHref = selectedPkg?.ctaHref || fallbackCheckoutUrl;
  const ctaLabel = selectedPkg
    ? `${selectedPkg.ctaLabel || "Kup teraz"} — ${formatPrice(selectedPkg.price, currency)}`
    : fallbackCtaLabel;

  // Primary CTA click: add the selected package to the client-side cart,
  // open the cart drawer, and fire a confirmation toast. Navigation to
  // the external checkout URL is suppressed — the user continues to
  // checkout from the cart drawer. This is the same pattern as Shopify.
  function handleCtaClick(e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) {
    trackHeroCtaClick(ctaLabel, ctaHref);
    if (!selectedPkg) return;

    e.preventDefault();
    trackBeginCheckout(productName, selectedPkg.price, currency);

    addToCart({
      id: selectedPkg.id,
      productId: selectedPkg.productId,
      variantId: selectedPkg.variationId,
      name: `${productName} · ${selectedPkg.label}`,
      price: selectedPkg.price,
      comparePrice: selectedPkg.comparePrice,
      currency,
      image: gallery[0]?.url,
    });
    showToast("Dodano do koszyka");
    openCart();
  }

  return (
    <>
      <section
        ref={sectionRef}
        className="bg-[var(--color-background)] pt-6 md:pt-10 pb-10 md:pb-16"
      >
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12">
            {/* ─── LEFT: gallery ─── */}
            <div className="lg:sticky lg:top-6 lg:self-start">
              <ImageGallery items={gallery} productName={productName} />
            </div>

            {/* ─── RIGHT: buy box ─── */}
            <div className="flex flex-col">
              {/* Rating */}
              {rating !== undefined && rating > 0 && (
                <div className="mb-3">
                  <StarRating
                    rating={rating}
                    reviewCount={reviewCount}
                    animateCount
                  />
                </div>
              )}

              {/* Headline */}
              <h1 className="text-2xl md:text-3xl lg:text-[2.25rem] font-extrabold text-[var(--color-text)] leading-[1.15] tracking-tight">
                {headline}
              </h1>

              {/* Subheadline */}
              {subheadline && (
                <p className="mt-2 text-base md:text-lg font-medium text-[var(--color-text)]">
                  {subheadline}
                </p>
              )}

              {/* Long description */}
              {description && (
                <p className="mt-3 text-sm md:text-base text-[var(--color-text-muted)] leading-relaxed">
                  {description}
                </p>
              )}

              {/* Effect-based bullets — short, dense */}
              {bullets.length > 0 && (
                <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  {bullets.map((b, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]"
                    >
                      <svg
                        className="w-4 h-4 text-[var(--color-success)] shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Trust badge (e.g. certification) */}
              {trustBadge && (
                <div className="mt-4 inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] text-xs font-semibold">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {trustBadge}
                </div>
              )}

              {/* Package selector */}
              {packages.length > 0 && (
                <div className="mt-6">
                  <PackageSelector
                    packages={packages}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    currency={currency}
                  />
                </div>
              )}

              {/* Primary CTA — large, full-width, price-aware, subtly pulsing */}
              <div className="mt-5">
                <Button
                  variant="primary"
                  size="lg"
                  href={ctaHref}
                  onClick={handleCtaClick}
                  className="w-full text-base md:text-lg py-4 cta-pulse"
                >
                  {ctaLabel}
                </Button>
              </div>

              {/* Social proof line — dynamic, rotates */}
              <div className="mt-2.5 text-center">
                <SocialProofBadge />
              </div>

              {/* Risk reversal short line directly under CTA */}
              {riskReversal && (
                <p className="mt-2 text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-1.5">
                  <svg
                    className="w-4 h-4 text-[var(--color-success)]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {riskReversal}
                </p>
              )}

              {/* Delivery / payment strip */}
              {(deliveryInfo || paymentInfo) && (
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[var(--color-border)]">
                  {deliveryInfo && (
                    <div className="flex items-start gap-2 text-xs text-[var(--color-text-muted)]">
                      <svg
                        className="w-5 h-5 text-[var(--color-accent)] shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9-1.5h12.75a.75.75 0 00.75-.75v-7.5A.75.75 0 0018.75 8.25H6.75A.75.75 0 006 9v8.25m0 0H4.875c-.621 0-1.125-.504-1.125-1.125V12c0-2.071 1.679-3.75 3.75-3.75h.375M18 18.75h.75a.75.75 0 00.75-.75V14.25"
                        />
                      </svg>
                      <div>
                        <p className="font-semibold text-[var(--color-text)]">Dostawa</p>
                        <p>{deliveryInfo}</p>
                      </div>
                    </div>
                  )}
                  {paymentInfo && (
                    <div className="flex items-start gap-2 text-xs text-[var(--color-text-muted)]">
                      <svg
                        className="w-5 h-5 text-[var(--color-accent)] shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                        />
                      </svg>
                      <div>
                        <p className="font-semibold text-[var(--color-text)]">Płatności</p>
                        <p>{paymentInfo}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Sticky mobile buy bar — appears once the hero scrolls out of view */}
      {selectedPkg && (
        <MobileBuyBar
          triggerRef={sectionRef}
          packageLabel={selectedPkg.label}
          price={selectedPkg.price}
          comparePrice={selectedPkg.comparePrice}
          currency={currency}
          ctaLabel={selectedPkg.ctaLabel || "Kup teraz"}
          ctaHref={ctaHref}
          onCtaClick={handleCtaClick}
        />
      )}
    </>
  );
}
