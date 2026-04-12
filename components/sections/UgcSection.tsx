import Container from "@/components/layout/Container";
import SectionShell from "@/components/layout/SectionShell";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/storefront/Reveal";
import UgcLoopCarousel, {
  type UgcReview,
} from "@/components/storefront/UgcLoopCarousel";

interface UgcSectionProps {
  title: string;
  description?: string;
  reviews: UgcReview[];
}

export default function UgcSection({ title, description, reviews }: UgcSectionProps) {
  if (reviews.length === 0 && !title) return null;

  return (
    <SectionShell background="surface">
      {/* Heading is kept inside Container for consistent alignment with the
          rest of the page. */}
      {title && (
        <Container>
          <Reveal>
            <SectionHeading title={title} subtitle={description} />
          </Reveal>
        </Container>
      )}

      {/* Carousel is full-bleed: it breaks out of Container entirely and
          stretches to the exact viewport edges. The deeper edge-fade mask
          on the carousel itself handles the visual clip. This is what
          produces the "off-screen" reach that top DTC stores use — cards
          peek from past the content edges, reinforcing the infinite-stream
          feel. */}
      <div className="full-bleed">
        <UgcLoopCarousel reviews={reviews} />
      </div>
    </SectionShell>
  );
}
