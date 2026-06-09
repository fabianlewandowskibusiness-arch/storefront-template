"use client";

import type { HeroPackage } from "@/types/storefront";
import { formatPrice } from "@/lib/utils/formatPrice";

interface PackageSelectorProps {
  packages: HeroPackage[];
  selectedId: string;
  onSelect: (id: string) => void;
  currency: string;
}

export default function PackageSelector({
  packages,
  selectedId,
  onSelect,
  currency,
}: PackageSelectorProps) {
  if (packages.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {packages.map((pkg) => {
        const isSelected = pkg.id === selectedId;
        const hasDiscount = pkg.comparePrice && pkg.comparePrice > pkg.price;

        return (
          <button
            key={pkg.id}
            type="button"
            onClick={() => onSelect(pkg.id)}
            aria-pressed={isSelected}
            className={`group w-full text-left relative rounded-[var(--radius)] border-2 p-4 transition-all duration-200 ease-out transform-gpu active:scale-[0.99] ${
              isSelected
                ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] shadow-md"
                : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-accent)] hover:-translate-y-0.5 hover:shadow-sm"
            }`}
          >
            {/* Marketing badge — rendered per card whenever the package has one.
                Independent of selected / default state: every option can show its
                own badge (e.g. "BESTSELLER" on one, "MAKSYMALNA OSZCZĘDNOŚĆ" on
                another). Capped width + truncate keeps long labels inside the card. */}
            {pkg.badge && (
              <span
                title={pkg.badge}
                className="absolute -top-2.5 right-4 z-10 inline-block max-w-[calc(100%-2rem)] truncate rounded-full bg-[var(--color-accent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm"
              >
                {pkg.badge}
              </span>
            )}

            <div className="flex items-center gap-3">
              {/* Radio — filled accent circle with a checkmark when selected */}
              <div
                className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                  isSelected
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                    : "border-[var(--color-border)] bg-transparent group-hover:border-[var(--color-accent)]"
                }`}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              {/* Label + savings */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm md:text-base text-[var(--color-text)] leading-tight">
                  {pkg.label}
                </p>
                {pkg.savings && (
                  <p className="text-xs text-[var(--color-success)] font-semibold mt-0.5">
                    {pkg.savings}
                  </p>
                )}
              </div>

              {/* Price column */}
              <div className="text-right shrink-0">
                <p className="font-extrabold text-base md:text-lg text-[var(--color-text)] leading-tight tabular-nums">
                  {formatPrice(pkg.price, currency)}
                </p>
                {hasDiscount && (
                  <p className="text-xs text-[var(--color-text-muted)] line-through tabular-nums">
                    {formatPrice(pkg.comparePrice!, currency)}
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
