import { cn } from "@/lib/utils/cn";

interface SectionShellProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  background?: "default" | "surface" | "accent-soft";
}

export default function SectionShell({ children, id, className, background = "default" }: SectionShellProps) {
  const bgMap: Record<string, string> = {
    default: "bg-[var(--color-background)]",
    surface: "bg-[var(--color-surface)]",
    "accent-soft": "bg-[var(--color-accent-soft)]",
  };

  return (
    <section
      id={id}
      className={cn(
        "py-14 md:py-20 lg:py-24",
        bgMap[background],
        className
      )}
    >
      {children}
    </section>
  );
}
