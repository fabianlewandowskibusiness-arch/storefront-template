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
            className={`w-full text-left relative rounded-[var(--radius)] border-2 p-3.5 md:p-4 transition-all duration-200 ease-out transform-gpu active:scale-[0.99] ${
              isSelected
                ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] shadow-lg scale-[1.01]"
                : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-accent)]/40 hover:shadow-sm"
            }`}
          >
            {pkg.isBestseller && (
              <span className="absolute -top-2.5 right-4 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-[var(--color-accent)] text-white rounded">
                {pkg.badge || "Bestseller"}
              </span>
            )}

            <div className="flex items-center gap-3">
              {/* Radio circle */}
              <div
                className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                  isSelected
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                    : "border-[var(--color-border)] bg-transparent"
                }`}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>

              {/* Label + savings */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm md:text-base text-[var(--color-text)] leading-tight">
                  {pkg.label}
                </p>
                {pkg.savings && (
                  <p className="text-xs text-[var(--color-success)] font-medium mt-0.5">
                    {pkg.savings}
                  </p>
                )}
              </div>

              {/* Price column */}
              <div className="text-right shrink-0">
                <p className="font-bold text-base md:text-lg text-[var(--color-text)] leading-tight">
                  {formatPrice(pkg.price, currency)}
                </p>
                {hasDiscount && (
                  <p className="text-xs text-[var(--color-text-muted)] line-through">
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
