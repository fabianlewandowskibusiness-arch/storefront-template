import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStorefrontConfig } from "@/lib/config/getStorefrontConfig";
import { generateLegalContent } from "@/lib/legal/templates";
import LegalPage from "@/components/legal/LegalPage";
import type { LegalPageKey, LegalPageEntry, SellerConfig } from "@/types/storefront";

// ── Helpers ──────────────────────────────────────────────────────────────────

const LEGAL_KEYS: LegalPageKey[] = ["returns", "shipping", "privacy", "terms", "contact"];

/**
 * Resolve the slug from the URL to a legal page key + entry.
 * Returns null if the slug does not match any enabled legal page.
 */
function resolveLegalPage(
  slug: string,
  legalPages: Record<string, LegalPageEntry | null | undefined> | null | undefined,
): { key: LegalPageKey; entry: LegalPageEntry } | null {
  if (!legalPages) return null;
  for (const key of LEGAL_KEYS) {
    const entry = legalPages[key];
    if (entry && entry.enabled && entry.slug === slug) {
      return { key, entry };
    }
  }
  return null;
}

/**
 * Default seller values used when the backend hasn't sent seller data yet.
 * Keeps templates rendereable even on incomplete configs.
 */
const EMPTY_SELLER: SellerConfig = {
  storeName: "",
  legalCompanyName: "",
  businessAddress: "",
  vatNumber: "",
  contactEmail: "",
  contactPhone: "",
  returnPolicyDays: 14,
  shippingCountries: "",
  dataControllerName: "",
  dataControllerAddress: "",
  storeUrl: "",
  additionalNotes: "",
};

// ── Metadata ─────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = await getStorefrontConfig();
  const resolved = resolveLegalPage(slug, config.legalPages);

  if (!resolved) {
    return { title: "Nie znaleziono strony" };
  }

  return {
    title: `${resolved.entry.title} | ${config.branding.storeName}`,
    robots: { index: true, follow: true },
  };
}

// ── Page component ───────────────────────────────────────────────────────────

export default async function LegalSlugPage({ params }: Props) {
  const { slug } = await params;
  const config = await getStorefrontConfig();
  const resolved = resolveLegalPage(slug, config.legalPages);

  if (!resolved) {
    notFound();
  }

  const seller: SellerConfig = config.seller ?? EMPTY_SELLER;
  // Override storeName from branding if seller.storeName is empty
  const effectiveSeller: SellerConfig = {
    ...seller,
    storeName: seller.storeName || config.branding.storeName,
    contactEmail: seller.contactEmail || "",
  };

  const sections = generateLegalContent(resolved.key, effectiveSeller);

  return (
    <LegalPage
      title={resolved.entry.title}
      sections={sections}
      storeName={config.branding.storeName}
    />
  );
}
