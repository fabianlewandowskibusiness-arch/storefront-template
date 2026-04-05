import type { StorefrontConfig } from "@/types/storefront";

export function buildThemeVariables(config: StorefrontConfig): Record<string, string> {
  const { palette, style } = config.theme;

  const radiusMap: Record<string, string> = {
    none: "0px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
  };

  const shadowMap: Record<string, string> = {
    none: "none",
    soft: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    medium: "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)",
    strong: "0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.06)",
  };

  const spacingMap: Record<string, string> = {
    compact: "1rem",
    comfortable: "1.5rem",
    spacious: "2rem",
  };

  return {
    "--color-background": palette.background,
    "--color-surface": palette.surface,
    "--color-primary": palette.primary,
    "--color-accent": palette.accent,
    "--color-accent-soft": palette.accentSoft,
    "--color-success": palette.success,
    "--color-warning": palette.warning,
    "--color-text": palette.text,
    "--color-text-muted": palette.textMuted,
    "--color-border": palette.border,
    "--radius": radiusMap[style.radius] ?? "16px",
    "--shadow": shadowMap[style.shadow] ?? shadowMap.soft,
    "--section-gap": spacingMap[style.spacing] ?? "1.5rem",
  };
}
