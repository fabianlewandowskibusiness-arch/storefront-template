import { cn } from "@/lib/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "success" | "warning";
  className?: string;
}

export default function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]",
    accent: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
    success: "bg-emerald-50 text-[var(--color-success)]",
    warning: "bg-amber-50 text-[var(--color-warning)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 text-xs font-medium rounded-full",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
