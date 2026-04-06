import Container from "@/components/layout/Container";

interface TrustBarSectionProps {
  items: string[];
}

export default function TrustBarSection({ items }: TrustBarSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="bg-[var(--color-surface)] border-y border-[var(--color-border)] py-5">
      <Container>
        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] font-medium">
              <svg className="w-4 h-4 text-[var(--color-success)] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {item}
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
