"use client";

import Container from "@/components/layout/Container";
import SectionShell from "@/components/layout/SectionShell";
import Button from "@/components/ui/Button";
import { trackFinalCtaClick, trackBeginCheckout } from "@/lib/analytics/tracking";

interface FinalCtaSectionProps {
  headline: string;
  subheadline: string;
  buttonLabel: string;
  checkoutUrl: string;
}

export default function FinalCtaSection({ headline, subheadline, buttonLabel, checkoutUrl }: FinalCtaSectionProps) {
  function handleClick() {
    trackFinalCtaClick(buttonLabel);
    trackBeginCheckout();
  }

  return (
    <SectionShell className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white">
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
            className="bg-white !text-[var(--color-primary)] hover:bg-gray-100 min-w-[260px] text-lg"
            onClick={handleClick}
          >
            {buttonLabel}
          </Button>
        </div>
      </Container>
    </SectionShell>
  );
}
