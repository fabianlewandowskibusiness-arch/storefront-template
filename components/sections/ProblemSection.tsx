import Container from "@/components/layout/Container";
import SectionShell from "@/components/layout/SectionShell";
import SectionHeading from "@/components/ui/SectionHeading";

interface ProblemSectionProps {
  config: {
    title: string;
    description: string;
    painPoints: string[];
  };
}

export default function ProblemSection({ config }: ProblemSectionProps) {
  return (
    <SectionShell background="surface">
      <Container narrow>
        <SectionHeading title={config.title} />
        <p className="text-center text-[var(--color-text-muted)] text-base md:text-lg leading-relaxed mb-10">
          {config.description}
        </p>
        {config.painPoints.length > 0 && (
          <div className="space-y-4 max-w-xl mx-auto">
            {config.painPoints.map((point, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius)] p-4 shadow-[var(--shadow)]"
              >
                <svg className="w-5 h-5 mt-0.5 text-[var(--color-warning)] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span className="text-sm md:text-base text-[var(--color-text)]">{point}</span>
              </div>
            ))}
          </div>
        )}
      </Container>
    </SectionShell>
  );
}
