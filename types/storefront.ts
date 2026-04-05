import type { z } from "zod";
import type { storefrontConfigSchema } from "@/lib/config/schema";

export type StorefrontConfig = z.infer<typeof storefrontConfigSchema>;

export type SectionType =
  | "announcementBar"
  | "hero"
  | "trustBar"
  | "benefits"
  | "problem"
  | "features"
  | "comparison"
  | "testimonials"
  | "offer"
  | "faq"
  | "finalCta"
  | "footer";

export interface SectionEntry {
  type: SectionType;
  enabled: boolean;
}

export interface CtaConfig {
  label: string;
  href?: string;
}

export interface PriceConfig {
  amount: number;
  currency: string;
  compareAtAmount?: number | null;
}

export interface ThemePalette {
  background: string;
  surface: string;
  primary: string;
  accent: string;
  accentSoft: string;
  success: string;
  warning: string;
  text: string;
  textMuted: string;
  border: string;
}

export interface ThemeStyle {
  radius: "none" | "sm" | "md" | "lg" | "xl" | "full";
  shadow: "none" | "soft" | "medium" | "strong";
  spacing: "compact" | "comfortable" | "spacious";
  heroVariant: "split-image" | "centered" | "full-bleed";
  buttonVariant: "rounded-solid" | "sharp-solid" | "rounded-outline" | "pill";
}
