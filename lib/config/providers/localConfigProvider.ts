import { storefrontConfigSchema } from "../schema";
import { normalizeStorefrontConfig } from "../normalizeStorefrontConfig";
import type { StorefrontConfig } from "@/types/storefront";

export async function loadLocalConfig(): Promise<StorefrontConfig> {
  const configJson = await import("@/config/storefront.config.json");
  const raw = configJson.default ?? configJson;

  const result = storefrontConfigSchema.safeParse(raw);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid local storefront config:\n${formatted}`);
  }

  return normalizeStorefrontConfig(result.data);
}
