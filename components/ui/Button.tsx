import { cn } from "@/lib/utils/cn";
import type { MouseEventHandler } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
  href?: string;
}

export default function Button({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  onClick,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold transition-all duration-200 ease-out transform-gpu focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-accent)]";

  const variants: Record<string, string> = {
    primary:
      "bg-[var(--color-accent)] text-white hover:brightness-110 active:brightness-95 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]",
    secondary:
      "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-accent-soft)]",
    outline:
      "border-2 border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white",
    ghost:
      "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]",
  };

  const sizes: Record<string, string> = {
    sm: "px-4 py-2 text-sm rounded-[calc(var(--radius)*0.75)]",
    md: "px-6 py-3 text-base rounded-[var(--radius)]",
    lg: "px-8 py-4 text-lg rounded-[var(--radius)]",
  };

  const classes = cn(base, variants[variant], sizes[size], className);

  if (href) {
    // Anchors forward onClick so callers can preventDefault() to intercept
    // navigation (e.g. hero "Buy now" → open cart drawer instead of
    // navigating to the external checkout URL).
    return (
      <a
        href={href}
        className={classes}
        onClick={onClick as unknown as MouseEventHandler<HTMLAnchorElement> | undefined}
      >
        {children}
      </a>
    );
  }

  return (
    <button className={classes} onClick={onClick} {...props}>
      {children}
    </button>
  );
}
