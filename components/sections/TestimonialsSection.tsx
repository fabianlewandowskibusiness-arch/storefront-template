import Container from "@/components/layout/Container";
import SectionShell, { type ShellOverride } from "@/components/layout/SectionShell";
import SectionHeading from "@/components/ui/SectionHeading";
import TestimonialsCarousel from "@/components/storefront/TestimonialsCarousel";
import type { ImageFrame } from "@/types/storefront";

interface Testimonial {
  name: string;
  quote: string;
  avatar?: string;
  avatarFrame?: ImageFrame | null;
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
