import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import type { StorefrontConfig } from "@/types/storefront";

interface HeroSectionProps {
  config: StorefrontConfig["hero"];
  product: StorefrontConfig["product"];
  heroVariant: string;
}

export default function HeroSection({ config, product, heroVariant }: HeroSectionProps) {
  const isSplit = heroVariant === "split-image";

  return (
    <section className="bg-[var(--color-background)] py-12 md:py-20 lg:py-28 overflow-hidden">
      <Container>
        <div
          className={
            isSplit
              ? "grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
              : "text-center max-w-3xl mx-auto"
          }
        >
          {/* Text content */}
          <div className={isSplit ? "" : "mb-10"}>
            {config.eyebrow && (
              <Badge variant="accent" className="mb-4">
                {config.eyebrow}
              </Badge>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold text-[var(--color-text)] leading-[1.1] tracking-tight">
              {config.headline}
            </h1>

            {config.subheadline && (
              <p className="mt-5 text-base md:text-lg text-[var(--color-text-muted)] leading-relaxed max-w-lg">
                {config.subheadline}
              </p>
            )}

            {config.benefitBullets.length > 0 && (
              <ul className="mt-6 space-y-2.5">
                {config.benefitBullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[var(--color-text)]">
                    <svg className="w-5 h-5 mt-0.5 text-[var(--color-success)] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm md:text-base">{bullet}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button variant="primary" size="lg" href={config.primaryCta.href}>
                {config.primaryCta.label}
              </Button>
              {config.secondaryCta && (
                <Button variant="secondary" size="lg" href={config.secondaryCta.href}>
                  {config.secondaryCta.label}
                </Button>
              )}
            </div>

            {product.badges.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {product.badges.map((badge, i) => (
                  <Badge key={i} variant="default">
                    {badge}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Product image */}
          <div className={isSplit ? "relative" : "mx-auto max-w-md"}>
            <div className="relative aspect-square rounded-[var(--radius)] overflow-hidden bg-[var(--color-surface)] shadow-[var(--shadow)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.primaryImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
