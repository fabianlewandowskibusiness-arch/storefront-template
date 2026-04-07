import { cn } from "@/lib/utils/cn";

// ── ShellOverride — phase-2 style meta keys ────────────────────────────────────
//
// Section components accept an optional `shellOverride` prop that maps directly
// from the underscore-prefixed keys stored in `section.settings`:
//   _backgroundStyle → backgroundStyle
//   _paddingTop      → paddingTop
//   _paddingBottom   → paddingBottom
//
// Missing keys mean "use the section's own default" — never override.

export interface ShellOverride {
  backgroundStyle?: "default" | "light" | "dark" | "accent";
  paddingTop?:      "none" | "sm" | "md" | "lg";
  paddingBottom?:   "none" | "sm" | "md" | "lg";
}

// ── Dark mode CSS variable overrides ──────────────────────────────────────────
//
// Applied as an inline `style` on the section element when backgroundStyle==="dark".
// Cascades to all child elements that use these CSS variables, so text, borders,
// and inner card backgrounds all adapt automatically without touching each component.

export const DARK_MODE_STYLE: React.CSSProperties = {
  "--color-background" : "#1e293b",  // slate-800  — inner card / item bg
  "--color-surface"    : "#273549",  // slate-800+ — secondary surfaces
  "--color-text"       : "#f1f5f9",  // slate-100  — primary text
  "--color-text-muted" : "#94a3b8",  // slate-400  — muted text
  "--color-border"     : "#334155",  // slate-700  — borders
} as React.CSSProperties;

// ── Background maps ────────────────────────────────────────────────────────────

/** Background classes used by the section's own `background` prop (base). */
const BASE_BG_MAP: Record<string, string> = {
  default:       "bg-[var(--color-background)]",
  surface:       "bg-[var(--color-surface)]",
  "accent-soft": "bg-[var(--color-accent-soft)]",
};

/**
 * Background classes applied by the editor's `_backgroundStyle` override.
 * Appended LAST in cn() so it wins over component-level className backgrounds
 * (e.g. FinalCtaSection's gradient — but that case is handled in the component
 * itself by conditionally suppressing the gradient className when an override
 * is active).
 */
const OVERRIDE_BG_MAP: Record<string, string> = {
  default: "bg-[var(--color-background)]",
  light:   "bg-[var(--color-surface)]",
  dark:    "bg-[var(--color-primary)]",     // #0f172a — dark navy
  accent:  "bg-[var(--color-accent-soft)]",
};

// ── Padding maps ───────────────────────────────────────────────────────────────

export const PT_MAP: Record<string, string> = {
  none: "pt-0",
  sm:   "pt-6 md:pt-10",
  md:   "pt-12 md:pt-16",
  lg:   "pt-14 md:pt-20 lg:pt-24",
};

export const PB_MAP: Record<string, string> = {
  none: "pb-0",
  sm:   "pb-6 md:pb-10",
  md:   "pb-12 md:pb-16",
  lg:   "pb-14 md:pb-20 lg:pb-24",
};

// ── Props ──────────────────────────────────────────────────────────────────────

interface SectionShellProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  /** Section's own default background — used when no override is active. */
  background?: "default" | "surface" | "accent-soft";
  /** Phase-2 style override — written by editor into section.settings._* keys. */
  override?: ShellOverride;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function SectionShell({
  children,
  id,
  className,
  background = "default",
  override,
}: SectionShellProps) {
  // ── Padding ──
  const hasPaddingOverride = override?.paddingTop || override?.paddingBottom;
  const paddingClass = hasPaddingOverride
    ? cn(
        PT_MAP[override!.paddingTop   ?? "lg"] ?? PT_MAP.lg,
        PB_MAP[override!.paddingBottom ?? "lg"] ?? PB_MAP.lg,
      )
    : "section-py-default";

  // ── Background ──
  const baseBg     = BASE_BG_MAP[background] ?? BASE_BG_MAP.default;
  const overrideBg = override?.backgroundStyle
    ? OVERRIDE_BG_MAP[override.backgroundStyle]
    : undefined;

  // ── Dark mode: cascade CSS variable overrides to all children ──
  const darkStyle = override?.backgroundStyle === "dark" ? DARK_MODE_STYLE : undefined;

  return (
    <section
      id={id}
      style={darkStyle}
      className={cn(
        paddingClass,
        baseBg,
        className,
        overrideBg, // last → wins over className gradient backgrounds
      )}
    >
      {children}
    </section>
  );
}
