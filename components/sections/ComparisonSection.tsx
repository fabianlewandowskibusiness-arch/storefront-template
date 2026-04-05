import Container from "@/components/layout/Container";
import SectionShell from "@/components/layout/SectionShell";
import SectionHeading from "@/components/ui/SectionHeading";

interface ComparisonSectionProps {
  config: {
    title: string;
    rows: { label: string; ours: string; other: string }[];
  };
  brandName: string;
}

export default function ComparisonSection({ config, brandName }: ComparisonSectionProps) {
  if (config.rows.length === 0) return null;

  return (
    <SectionShell background="surface">
      <Container>
        <SectionHeading title={config.title} />
        <div className="overflow-x-auto">
          <table className="w-full max-w-2xl mx-auto text-sm md:text-base">
            <thead>
              <tr className="border-b-2 border-[var(--color-border)]">
                <th className="text-left py-3 px-4 text-[var(--color-text-muted)] font-medium" />
                <th className="text-center py-3 px-4 text-[var(--color-accent)] font-bold">
                  {brandName}
                </th>
                <th className="text-center py-3 px-4 text-[var(--color-text-muted)] font-medium">
                  Inne produkty
                </th>
              </tr>
            </thead>
            <tbody>
              {config.rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-[var(--color-border)] last:border-b-0"
                >
                  <td className="py-3.5 px-4 text-[var(--color-text)] font-medium">
                    {row.label}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1.5 text-[var(--color-success)] font-medium">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {row.ours}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center text-[var(--color-text-muted)]">
                    {row.other}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </SectionShell>
  );
}
