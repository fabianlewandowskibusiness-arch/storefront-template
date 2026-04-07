import Container from "@/components/layout/Container";
import SectionShell, { type ShellOverride } from "@/components/layout/SectionShell";
import SectionHeading from "@/components/ui/SectionHeading";

interface FeaturesSectionProps {
  title: string;
  items: { name: string; description: string }[];
  shellOverride?: ShellOverride;
}

export default function FeaturesSection({ title, items, shellOverride }: FeaturesSectionProps) {
  return (
    <SectionShell override={shellOverride}>
      <Container>
        <SectionHeading title={title} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {items.map((item, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent)] font-bold text-sm">
                {i + 1}
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-[var(--color-text)] mb-1">
                  {item.name}
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </SectionShell>
  );
}
