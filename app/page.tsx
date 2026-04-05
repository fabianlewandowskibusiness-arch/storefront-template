import { getStorefrontConfig } from "@/lib/config/getStorefrontConfig";
import { getEnabledSections } from "@/lib/storefront/getEnabledSections";
import { renderSection } from "@/lib/storefront/renderSection";
import { createCommerceProvider } from "@/lib/commerce/provider";
import AnalyticsInit from "@/components/AnalyticsInit";

export default async function HomePage() {
  const config = await getStorefrontConfig();
  const commerce = createCommerceProvider(config);
  const checkoutUrl = commerce?.getCheckoutUrl() ?? "#offer";
  const sections = getEnabledSections(config.sections);

  return (
    <>
      <AnalyticsInit enabled={config.analytics.enabled} />
      <main>
        {sections.map((section) =>
          renderSection({ type: section.type, config, checkoutUrl })
        )}
      </main>
    </>
  );
}
