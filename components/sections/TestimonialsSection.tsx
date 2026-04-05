import Container from "@/components/layout/Container";
import SectionShell from "@/components/layout/SectionShell";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";

interface TestimonialsSectionProps {
  config: {
    title: string;
    items: { name: string; quote: string; avatar?: string }[];
  };
}

export default function TestimonialsSection({ config }: TestimonialsSectionProps) {
  return (
    <SectionShell>
      <Container>
        <SectionHeading title={config.title} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {config.items.map((item, i) => (
            <Card key={i} className="flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                {item.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="w-10 h-10 rounded-full object-cover bg-[var(--color-accent-soft)]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent)] font-bold text-sm">
                    {item.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm text-[var(--color-text)]">{item.name}</p>
                  <div className="flex gap-0.5 text-[var(--color-warning)]">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <svg key={si} className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <blockquote className="text-sm text-[var(--color-text-muted)] leading-relaxed italic flex-1">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
            </Card>
          ))}
        </div>
      </Container>
    </SectionShell>
  );
}
