import Container from "@/components/layout/Container";
import SectionShell from "@/components/layout/SectionShell";

interface Step {
  title: string;
  description: string;
}

interface RiskReversalSectionProps {
  title: string;
  guaranteeText: string;
  description: string;
  steps: Step[];
}

export default function RiskReversalSection({
  title,
  guaranteeText,
  description,
  steps,
}: RiskReversalSectionProps) {
  return (
    <SectionShell>
      <Container narrow>
        <div className="bg-[var(--color-surface)] border-2 border-[var(--color-success)]/30 rounded-[var(--radius)] p-8 md:p-12 text-center">
          {/* Big shield icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--color-success)]/10 mb-5">
            <svg
              className="w-12 h-12 text-[var(--color-success)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>

          {guaranteeText && (
            <p className="text-xs font-bold text-[var(--color-success)] uppercase tracking-widest mb-2">
              {guaranteeText}
            </p>
          )}
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] leading-tight mb-4">
            {title}
          </h2>
          <p className="text-base text-[var(--color-text-muted)] leading-relaxed mb-8 max-w-xl mx-auto">
            {description}
          </p>

          {/* Step-by-step explanation */}
          {steps.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="bg-[var(--color-background)] rounded-[var(--radius)] p-4 border border-[var(--color-border)]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-success)] text-white text-sm font-bold">
                      {i + 1}
                    </span>
                    <h3 className="font-semibold text-sm text-[var(--color-text)]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </SectionShell>
  );
}
