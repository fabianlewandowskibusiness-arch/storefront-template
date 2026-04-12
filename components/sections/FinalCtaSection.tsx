"use client";

import Container from "@/components/layout/Container";
import SectionShell, { type ShellOverride } from "@/components/layout/SectionShell";
import Button from "@/components/ui/Button";
import { trackFinalCtaClick, trackBeginCheckout } from "@/lib/analytics/tracking";

interface FinalCtaSectionProps {
  headline: string;
  subheadline?: string;
  buttonLabel: string;
  checkoutUrl: string;
  trustItems?: string[];
  shellOverride?: ShellOverride;
}

export default function FinalCtaSection({
  headline,
  subheadline,
  buttonLabel,
  checkoutUrl,
  trustItems = [],
  shellOverride,
}: FinalCtaSectionProps) {
  const hasBackgroundOverride =
    !!shellOverride?.backgroundStyle && shellOverride.backgroundStyle !== "default";

  // The default look is a strong gradient with white type. Editor overrides
  // can replace it with a flat background; in that case we strip the gradient
  // class and let SectionShell drive the background + text colour.
  const sectionClassName = hasBackgroundOverride
    ? undefined
    : "bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary)] to-[var(--color-accent)] text-white";

  const buttonClassName = hasBackgroundOverride
    ? "min-w-[280px] text-lg py-4"
    : "bg-white !text-[var(--color-primary)] hover:bg-gray-100 min-w-[280px] text-lg py-4";

  function handleClick() {
    trackFinalCtaClick(buttonLabel);
    trackBeginCheckout();
  }

  return (
    <SectionShell className={sectionClassName} override={shellOverride}>
      <Container narrow>
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
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

          {/* Trust signals strip under the CTA */}
          {trustItems.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm opacity-90">
              {trustItems.map((t, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </Container>
    </SectionShell>
  );
}
