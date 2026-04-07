"use client";

import Container from "@/components/layout/Container";
import SectionShell, { type ShellOverride } from "@/components/layout/SectionShell";
import Button from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils/formatPrice";
import { trackOfferCtaClick, trackBeginCheckout } from "@/lib/analytics/tracking";

interface OfferSectionProps {
  title: string;
  priceLabel: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  ctaLabel: string;
  checkoutUrl: string;
  anchorId: string;
  guaranteeText: string;
  included: string[];
  shellOverride?: ShellOverride;
}

export default function OfferSection({
  title,
  priceLabel,
  price,
  compareAtPrice,
  currency,
  ctaLabel,
  checkoutUrl,
  anchorId,
  guaranteeText,
  included,
  shellOverride,
}: OfferSectionProps) {
  const hasDiscount = compareAtPrice && compareAtPrice > price;

  function handleCtaClick() {
    trackOfferCtaClick(ctaLabel);
    trackBeginCheckout(undefined, price, currency);
  }

  return (
    <SectionShell id={anchorId} background="accent-soft" override={shellOverride}>
      <Container narrow>
        <div className="bg-[var(--color-background)] rounded-[var(--radius)] shadow-[var(--shadow)] border border-[var(--color-border)] p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-4">
            {title}
          </h2>

          <div className="mb-6">
            {priceLabel && (
              <p className="text-sm text-[var(--color-text-muted)] mb-1">{priceLabel}</p>
            )}
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl md:text-5xl font-extrabold text-[var(--color-accent)]">
                {formatPrice(price, currency)}
              </span>
              {hasDiscount && (
                <span className="text-xl text-[var(--color-text-muted)] line-through">
                  {formatPrice(compareAtPrice, currency)}
                </span>
              )}
            </div>
          </div>

          {included.length > 0 && (
            <ul className="mb-8 space-y-2 inline-block text-left">
              {included.map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-[var(--color-text)]">
                  <svg className="w-4 h-4 text-[var(--color-success)] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          )}

          <div className="mb-6">
            <Button
              variant="primary"
              size="lg"
              href={checkoutUrl}
              className="w-full sm:w-auto min-w-[280px] text-lg"
              onClick={handleCtaClick}
            >
              {ctaLabel}
            </Button>
          </div>

          {guaranteeText && (
            <p className="text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-1.5">
              <svg className="w-4 h-4 text-[var(--color-success)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
              {guaranteeText}
            </p>
          )}
        </div>
      </Container>
    </SectionShell>
  );
}
