import { cn } from "@/lib/utils/cn";
import Container from "@/components/layout/Container";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { type ShellOverride, DARK_MODE_STYLE } from "@/components/layout/SectionShell";

// ── Background and padding maps — mirrors SectionShell but uses Hero defaults ──
//
// Hero's default spacing (py-12 md:py-20 lg:py-28) is intentionally larger than
// generic SectionShell defaults. The `lg` preset preserves this existing value
// so removing an override always restores the Hero to its original proportions.

const HERO_BG_MAP: Record<string, string> = {
  default: "bg-[var(--color-background)]",
  light:   "bg-[var(--color-surface)]",
  dark:    "bg-[var(--color-primary)]",
  accent:  "bg-[var(--color-accent-soft)]",
};

const HERO_PT_MAP: Record<string, string> = {
  none: "pt-0",
  sm:   "pt-6 md:pt-10",
  md:   "pt-10 md:pt-16",
  lg:   "pt-12 md:pt-20 lg:pt-28",  // matches original py-12 md:py-20 lg:py-28
};

const HERO_PB_MAP: Record<string, string> = {
  none: "pb-0",
  sm:   "pb-6 md:pb-10",
  md:   "pb-10 md:pb-16",
  lg:   "pb-12 md:pb-20 lg:pb-28",
};

// ── Props ──────────────────────────────────────────────────────────────────────

interface HeroSectionProps {
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  image: string;
  imageAlt: string;
  /**
   * Layout variant — controlled by _sectionVariant (legacy heroVariant fallback).
   *   "split-image"         — content left, image right (default)
   *   "centered"            — text centred, image below
   *   "split-image-reverse" — image left, content right
   */
  sectionVariant: string;
  bullets: string[];
  badges: string[];
  /** Phase-2 style override from section.settings._* keys. */
  shellOverride?: ShellOverride;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function HeroSection({
  eyebrow,
  headline,
  subheadline,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  image,
  imageAlt,
  sectionVariant,
  bullets,
  badges,
  shellOverride,
}: HeroSectionProps) {
  const isSplit    = sectionVariant === "split-image" || sectionVariant === "split-image-reverse";
  const isReverse  = sectionVariant === "split-image-reverse";
  const isCentered = !isSplit;

  // ── Background ──
  const bgClass = shellOverride?.backgroundStyle
    ? HERO_BG_MAP[shellOverride.backgroundStyle] ?? HERO_BG_MAP.default
    : "bg-[var(--color-background)]";

  // ── Padding ──
  const hasPaddingOverride = shellOverride?.paddingTop || shellOverride?.paddingBottom;
  const paddingClass = hasPaddingOverride
    ? cn(
        HERO_PT_MAP[shellOverride!.paddingTop   ?? "lg"] ?? HERO_PT_MAP.lg,
        HERO_PB_MAP[shellOverride!.paddingBottom ?? "lg"] ?? HERO_PB_MAP.lg,
      )
    : "section-py-default";

  // ── Dark mode: cascade CSS variable overrides to all children ──
  const darkStyle = shellOverride?.backgroundStyle === "dark" ? DARK_MODE_STYLE : undefined;

  return (
    <section
      className={cn(bgClass, paddingClass, "overflow-hidden")}
      style={darkStyle}
    >
      <Container>
        <div
          className={cn(
            isSplit
              ? "grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
              : "text-center max-w-3xl mx-auto",
          )}
        >
          {/* ── Content column ── */}
          <div className={cn(isCentered && "mb-10", isReverse && "lg:order-2")}>
            {eyebrow && (
              <Badge variant="accent" className="mb-4">
                {eyebrow}
              </Badge>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold text-[var(--color-text)] leading-[1.1] tracking-tight">
              {headline}
            </h1>

            {subheadline && (
              <p className="mt-5 text-base md:text-lg text-[var(--color-text-muted)] leading-relaxed max-w-lg">
                {subheadline}
              </p>
            )}

            {bullets.length > 0 && (
              <ul className="mt-6 space-y-2.5">
                {bullets.map((bullet, i) => (
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
              <Button variant="primary" size="lg" href={primaryCtaHref}>
                {primaryCtaLabel}
              </Button>
              {secondaryCtaLabel && (
                <Button variant="secondary" size="lg" href={secondaryCtaHref}>
                  {secondaryCtaLabel}
                </Button>
              )}
            </div>

            {badges.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {badges.map((badge, i) => (
                  <Badge key={i} variant="default">
                    {badge}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* ── Image column ── */}
          <div className={cn(isSplit ? "relative" : "mx-auto max-w-md", isReverse && "lg:order-1")}>
            <div className="relative aspect-square rounded-[var(--radius)] overflow-hidden bg-[var(--color-surface)] shadow-[var(--shadow)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={imageAlt}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
