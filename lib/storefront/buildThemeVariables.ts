import type { ThemeConfig } from "@/types/storefront";

const RADIUS_MAP: Record<string, string> = {
  none: "0px",
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
};

const SHADOW_MAP: Record<string, string> = {
  none: "none",
  soft: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  medium: "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)",
  strong: "0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.06)",
};

const SPACING_MAP: Record<string, string> = {
  compact: "1rem",
  comfortable: "1.5rem",
  spacious: "2rem",
};

export function buildThemeVariables(theme: ThemeConfig): Record<string, string> {
  return {
    "--color-background": theme.backgroundColor,
    "--color-surface": theme.surfaceColor,
    "--color-primary": theme.primaryColor,
    "--color-accent": theme.accentColor,
    "--color-accent-soft": theme.accentSoftColor,
    "--color-success": theme.successColor,
    "--color-warning": theme.warningColor,
    "--color-text": theme.textColor,
    "--color-text-muted": theme.mutedTextColor,
    "--color-border": theme.borderColor,
    "--radius": RADIUS_MAP[theme.radius] ?? "16px",
    "--shadow": SHADOW_MAP[theme.shadow] ?? SHADOW_MAP.soft,
    "--section-gap": SPACING_MAP[theme.spacing] ?? "1.5rem",
  };
}
