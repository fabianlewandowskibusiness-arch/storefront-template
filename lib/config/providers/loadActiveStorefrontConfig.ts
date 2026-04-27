import { headers } from "next/headers";
import type { StorefrontConfig } from "@/types/storefront";
import { loadLocalConfig } from "./localConfigProvider";
import { loadRemoteConfig, loadRemoteConfigByHost } from "./remoteConfigProvider";

export type ConfigMode = "host" | "legacy" | "local";

/**
 * Determines which config loading mode to use for the current request.
 *
 * Priority:
 *  1. host  — `x-storefront-host` header is present (multi-tenant production)
 *  2. legacy — `STORE_ID` env var is set (single-tenant / legacy deployments)
 *  3. local  — neither is available (local dev with no env config)
 *
 * This function reads the request headers via Next.js `headers()`, so it must
 * be called from a Server Component or Route Handler context.
 */
export async function getConfigMode(): Promise<ConfigMode> {
  const requestHeaders = await headers();
  const storefrontHost = requestHeaders.get("x-storefront-host");

  if (storefrontHost && storefrontHost.trim()) {
    return "host";
  }

  if (process.env.STORE_ID) {
    return "legacy";
  }

  return "local";
}

/**
 * Loads the active storefront config using the appropriate strategy for the
 * current request environment.
 *
 * Resolution order:
 *  1. **host**   — `x-storefront-host` header present → `loadRemoteConfigByHost()`
 *                  Used in multi-tenant production (one Vercel project, many storefronts).
 *                  The response includes `storeId` for commerce handoff + cache tags.
 *
 *  2. **legacy** — `STORE_ID` env var set → `loadRemoteConfig()`
 *                  Used by single-tenant deployments with a per-deployment STORE_ID.
 *                  Preserved for backward compatibility — not yet removed.
 *
 *  3. **local**  — neither → `loadLocalConfig()`
 *                  Used in local development with no env config.
 *
 * The `react.cache()` wrapper in `getStorefrontConfig.ts` deduplicates calls
 * within a single server render pass.
 */
export async function loadActiveStorefrontConfig(): Promise<StorefrontConfig> {
  const mode = await getConfigMode();

  if (mode === "host") {
    return loadRemoteConfigByHost();
  }

  if (mode === "legacy") {
    return loadRemoteConfig();
  }

  return loadLocalConfig();
}
