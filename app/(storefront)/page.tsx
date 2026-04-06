import { getStorefrontConfig } from "@/lib/config/getStorefrontConfig";
import { resolveHomePage } from "@/lib/storefront/resolveHomePage";
import { renderSection } from "@/lib/storefront/renderSection";
import { createCommerceProvider } from "@/lib/commerce/provider";
import AnalyticsInit from "@/components/AnalyticsInit";

export default async function HomePage() {
  const config = await getStorefrontConfig();
  const home = resolveHomePage(config);
  const commerce = createCommerceProvider(config.commerce);
  const checkoutUrl = commerce?.getCheckoutUrl() ?? "#offer";

  const sortedSections = [...home.sections].sort((a, b) => a.position - b.position);

  const ctx = {
    branding: config.branding,
    commerce: config.commerce,
    checkoutUrl,
  };

  return (
    <>
      <AnalyticsInit enabled={config.analytics.enabled} />
      <main>
        {sortedSections.map((section) => renderSection(section, ctx))}
      </main>
    </>
  );
}
