import type { StorefrontConfig } from "@/types/storefront";
import { loadLocalConfig } from "./localConfigProvider";
import { loadRemoteConfig } from "./remoteConfigProvider";

export type ConfigMode = "local" | "remote";

export function getConfigMode(): ConfigMode {
  return process.env.STORE_ID ? "remote" : "local";
}

export async function loadActiveStorefrontConfig(): Promise<StorefrontConfig> {
  const mode = getConfigMode();

  if (mode === "remote") {
    return loadRemoteConfig();
  }

  return loadLocalConfig();
}
