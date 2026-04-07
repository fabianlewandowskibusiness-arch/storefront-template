import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { storefrontConfigSchema } from "../schema";
import type { StorefrontConfig } from "@/types/storefront";

const DEFAULT_API_URL = "https://api.ecommerce-flow.ai";
const REVALIDATE_SECONDS = 60;

function log(storeId: string, message: string, ...args: unknown[]) {
  console.error(`[storefront][store:${storeId}] ${message}`, ...args);
}

export async function loadRemoteConfig(): Promise<StorefrontConfig> {
  const storeId = process.env.STORE_ID;
  const apiUrl = (process.env.STOREFRONT_API_URL || DEFAULT_API_URL).replace(/\/$/, "");

  if (!storeId) {
    throw new Error("STORE_ID is required for remote config loading");
  }

  // Draft mode is signalled by the middleware via x-storefront-mode: draft.
  // In draft mode we bypass the CDN cache and fetch the latest saved version.
  const requestHeaders = await headers();
  const isDraft = requestHeaders.get("x-storefront-mode") === "draft";

  const url = isDraft
    ? `${apiUrl}/storefront-runtime/${storeId}?mode=draft`
    : `${apiUrl}/storefront-runtime/${storeId}`;

  let response: Response;
  try {
    response = await fetch(url, isDraft
      ? { cache: "no-store", headers: { Accept: "application/json" } }
      : { next: { revalidate: REVALIDATE_SECONDS }, headers: { Accept: "application/json" } },
    );
  } catch (error) {
    log(storeId, "Network error fetching config:", error);
    redirect("/store-unavailable");
  }

  if (response.status === 404) {
    log(storeId, "Store not found (404)");
    redirect("/store-not-found");
  }

  if (response.status === 401 || response.status === 403) {
    log(storeId, `Unexpected auth error (${response.status}) on public endpoint — check backend configuration`);
    redirect("/store-unavailable");
  }

  if (!response.ok) {
    log(storeId, `API error: ${response.status} ${response.statusText}`);
    redirect("/store-unavailable");
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    log(storeId, "Response is not valid JSON");
    redirect("/config-error");
  }

  const result = storefrontConfigSchema.safeParse(raw);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    log(storeId, `Config validation failed:\n${formatted}`);
    redirect("/config-error");
  }

  return result.data;
}
