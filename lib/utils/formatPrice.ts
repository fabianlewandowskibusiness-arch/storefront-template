const CURRENCY_MAP: Record<string, { locale: string; code: string }> = {
  PLN: { locale: "pl-PL", code: "PLN" },
  EUR: { locale: "de-DE", code: "EUR" },
  USD: { locale: "en-US", code: "USD" },
  GBP: { locale: "en-GB", code: "GBP" },
};

export function formatPrice(amount: number, currency: string): string {
  const mapped = CURRENCY_MAP[currency] ?? { locale: "en-US", code: currency };
  return new Intl.NumberFormat(mapped.locale, {
    style: "currency",
    currency: mapped.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
