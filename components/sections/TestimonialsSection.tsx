import Container from "@/components/layout/Container";
import SectionShell, { type ShellOverride } from "@/components/layout/SectionShell";
import SectionHeading from "@/components/ui/SectionHeading";
import TestimonialsCarousel from "@/components/storefront/TestimonialsCarousel";

interface Testimonial {
  name: string;
  quote: string;
  avatar?: string;
  rating?: number;
  location?: string;
}

interface TestimonialsSectionProps {
  title: string;
  items: Testimonial[];
  shellOverride?: ShellOverride;
}

export default function TestimonialsSection({
  title,
  items,
  shellOverride,
}: TestimonialsSectionProps) {
  return (
    <SectionShell override={shellOverride}>
      <Container>
        <SectionHeading title={title} />
        <TestimonialsCarousel items={items} />
      </Container>
    </SectionShell>
  );
}
