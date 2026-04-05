import { cache } from "react";
import { loadActiveStorefrontConfig } from "./providers/loadActiveStorefrontConfig";

/**
 * Request-scoped cached config loader.
 * React cache() deduplicates calls within a single server render pass,
 * so layout.tsx and page.tsx can both call this without double-fetching.
 */
export const getStorefrontConfig = cache(async () => {
  return loadActiveStorefrontConfig();
});
