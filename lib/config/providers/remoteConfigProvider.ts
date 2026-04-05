import { redirect } from "next/navigation";
import { storefrontConfigSchema } from "../schema";
import { normalizeStorefrontConfig } from "../normalizeStorefrontConfig";
import type { StorefrontConfig } from "@/types/storefront";

const DEFAULT_API_URL = "https://api.ecommerce-flow.ai";
const REVALIDATE_SECONDS = 60;

export async function loadRemoteConfig(): Promise<StorefrontConfig> {
  const storeId = process.env.STORE_ID;
  const apiUrl = (process.env.STOREFRONT_API_URL || DEFAULT_API_URL).replace(/\/$/, "");

  if (!storeId) {
    throw new Error("STORE_ID is required for remote config loading");
  }

  const url = `${apiUrl}/storefront-runtime/${storeId}`;

  let response: Response;
  try {
    response = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: {
        Accept: "application/json",
        "X-Store-Id": storeId,
      },
    });
  } catch (error) {
    console.error(`[storefront] Network error fetching config for store "${storeId}":`, error);
    redirect("/store-unavailable");
  }

  if (response.status === 404) {
    console.error(`[storefront] Store not found: "${storeId}"`);
    redirect("/store-not-found");
  }

  if (!response.ok) {
    console.error(
      `[storefront] API error for store "${storeId}": ${response.status} ${response.statusText}`
    );
    redirect("/store-unavailable");
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    console.error(`[storefront] Invalid JSON response for store "${storeId}"`);
    redirect("/config-error");
  }

  const result = storefrontConfigSchema.safeParse(raw);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    console.error(`[storefront] Config validation failed for store "${storeId}":\n${formatted}`);
    redirect("/config-error");
  }

  return normalizeStorefrontConfig(result.data);
}
