import type { ThemeConfig } from "@/types/storefront";

const RADIUS_MAP: Record<string, string> = {
  none: "0px",
  sm:   "4px",
  md:   "8px",
  lg:   "12px",
  xl:   "16px",
  full: "9999px",
};

const SHADOW_MAP: Record<string, string> = {
  none:   "none",
  soft:   "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  medium: "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)",
  strong: "0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.06)",
};

// Section-gap: spacing between inline content items (e.g. icon-text rows, feature cards).
const SECTION_GAP_MAP: Record<string, string> = {
  compact:     "1rem",
  comfortable: "1.5rem",
  spacious:    "2rem",
};

// Section-py: default vertical padding for sections when no _paddingTop/_paddingBottom override
// is active.  "comfortable" (5rem = 80 px ≈ py-20) matches the previous hardcoded mid-point.
const SECTION_PY_MAP: Record<string, string> = {
  compact:     "3rem",   // tight pages
  comfortable: "5rem",   // default (≈ py-20)
  spacious:    "7rem",   // generous breathing room
};

// ── Font preset → CSS font stack ──────────────────────────────────────────────

interface FontStack {
  body:    string;
  heading: string;
}

const FONT_MAP: Record<string, FontStack> = {
  modern:   {
    body:    "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    heading: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  classic:  {
    body:    "Georgia, 'Times New Roman', Times, serif",
    heading: "Georgia, 'Times New Roman', Times, serif",
  },
  humanist: {
    body:    "'Trebuchet MS', Verdana, Arial, sans-serif",
    heading: "'Trebuchet MS', Verdana, Arial, sans-serif",
  },
  minimal:  {
    body:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    heading: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
};

export function buildThemeVariables(theme: ThemeConfig): Record<string, string> {
  const font = FONT_MAP[theme.fontPreset] ?? FONT_MAP.modern;

  return {
    "--color-background": theme.backgroundColor,
    "--color-surface":    theme.surfaceColor,
    "--color-primary":    theme.primaryColor,
    "--color-accent":     theme.accentColor,
    "--color-accent-soft": theme.accentSoftColor,
    "--color-success":    theme.successColor,
    "--color-warning":    theme.warningColor,
    "--color-text":       theme.textColor,
    "--color-text-muted": theme.mutedTextColor,
    "--color-border":     theme.borderColor,
    "--radius":           RADIUS_MAP[theme.radius]  ?? "16px",
    "--shadow":           SHADOW_MAP[theme.shadow]  ?? SHADOW_MAP.soft,
    "--section-gap":      SECTION_GAP_MAP[theme.spacing] ?? "1.5rem",
    "--section-py":       SECTION_PY_MAP[theme.spacing]  ?? "5rem",
    "--font-family":      font.body,
    "--font-heading":     font.heading,
  };
}
