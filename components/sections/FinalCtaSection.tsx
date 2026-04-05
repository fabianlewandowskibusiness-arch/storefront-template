"use client";

import Container from "@/components/layout/Container";
import SectionShell from "@/components/layout/SectionShell";
import Button from "@/components/ui/Button";
import type { StorefrontConfig } from "@/types/storefront";
import { trackFinalCtaClick, trackBeginCheckout } from "@/lib/analytics/tracking";

interface FinalCtaSectionProps {
  config: NonNullable<StorefrontConfig["finalCta"]>;
  checkoutUrl: string;
}

export default function FinalCtaSection({ config, checkoutUrl }: FinalCtaSectionProps) {
  function handleClick() {
    trackFinalCtaClick(config.buttonLabel);
    trackBeginCheckout();
  }

  return (
    <SectionShell className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white">
      <Container narrow>
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 leading-tight">
            {config.headline}
          </h2>
          {config.subheadline && (
            <p className="text-base md:text-lg opacity-90 mb-8 max-w-xl mx-auto leading-relaxed">
              {config.subheadline}
            </p>
          )}
          <Button
            variant="primary"
            size="lg"
            href={checkoutUrl}
            className="bg-white !text-[var(--color-primary)] hover:bg-gray-100 min-w-[260px] text-lg"
            onClick={handleClick}
          >
            {config.buttonLabel}
          </Button>
        </div>
      </Container>
    </SectionShell>
  );
}
