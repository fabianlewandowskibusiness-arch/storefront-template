"use client";

import Container from "@/components/layout/Container";
import SectionShell, { type ShellOverride } from "@/components/layout/SectionShell";
import Button from "@/components/ui/Button";
import { trackFinalCtaClick, trackBeginCheckout } from "@/lib/analytics/tracking";

interface FinalCtaSectionProps {
  headline: string;
  subheadline: string;
  buttonLabel: string;
  checkoutUrl: string;
  shellOverride?: ShellOverride;
}

export default function FinalCtaSection({
  headline,
  subheadline,
  buttonLabel,
  checkoutUrl,
  shellOverride,
}: FinalCtaSectionProps) {
  function handleClick() {
    trackFinalCtaClick(buttonLabel);
    trackBeginCheckout();
  }

  // When a real background override is active ('light', 'dark', 'accent'),
  // suppress the gradient className so SectionShell's override background wins.
  // The gradient is only the section's own default — it should not resist an
  // explicit editor override.
  //
  // 'default' and undefined are both treated as "no override" — gradient applies.
  const hasBackgroundOverride =
    !!shellOverride?.backgroundStyle && shellOverride.backgroundStyle !== "default";

  // When gradient is active, explicit white text is needed (text-white).
  // When an override background is active, text colour comes from CSS variables:
  //   - dark  → --color-text overridden to #f1f5f9 by SectionShell's DARK_MODE_STYLE
  //   - light / accent → --color-text stays #111827 (default dark, readable)
  // No explicit text class needed in either override case.
  const sectionClassName = hasBackgroundOverride
    ? undefined
    : "bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white";

  // The CTA button uses white background with primary-coloured text.
  // This reads well against the gradient and remains acceptable against dark/accent
  // backgrounds. For light override it is less ideal but still functional.
  const buttonClassName = hasBackgroundOverride
    ? "min-w-[260px] text-lg"
    : "bg-white !text-[var(--color-primary)] hover:bg-gray-100 min-w-[260px] text-lg";

  return (
    <SectionShell className={sectionClassName} override={shellOverride}>
      <Container narrow>
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 leading-tight">
            {headline}
          </h2>
          {subheadline && (
            <p className="text-base md:text-lg opacity-90 mb-8 max-w-xl mx-auto leading-relaxed">
              {subheadline}
            </p>
          )}
          <Button
            variant="primary"
            size="lg"
            href={checkoutUrl}
            className={buttonClassName}
            onClick={handleClick}
          >
            {buttonLabel}
          </Button>
        </div>
      </Container>
    </SectionShell>
  );
}
