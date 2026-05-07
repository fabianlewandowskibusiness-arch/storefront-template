import Container from "@/components/layout/Container";
import SectionShell from "@/components/layout/SectionShell";
import FramedImage from "@/components/ui/FramedImage";
import type { ImageFrame } from "@/types/storefront";

interface StoryParagraph {
  heading?: string;
  body: string;
}

interface StorySectionProps {
  title: string;
  intro?: string;
  image?: string;
  /** Presentation frame for image. Null = renderer defaults (cover). */
  imageFrame?: ImageFrame | null;
  paragraphs: StoryParagraph[];
}

export default function StorySection({ title, intro, image, imageFrame, paragraphs }: StorySectionProps) {
  // Missing-media fallback: `image` maps to the canonical `media` field, which
  // may be `null` per the storefront media contract (see lib/storefront/mediaFields.ts).
  // When it is absent we deliberately collapse to a single centered column so
  // the narrative reads cleanly on its own — this is an intentional empty
  // state, not an accidental layout side effect.
  const hasImage = !!image;

  return (
    <SectionShell background="surface">
      <Container>
        <div
          className={`grid gap-10 items-start ${
            hasImage ? "grid-cols-1 lg:grid-cols-[1fr_1.2fr]" : "grid-cols-1"
          }`}
        >
          {hasImage && (
            <div className="lg:sticky lg:top-8">
              <FramedImage
                src={image!}
                alt={title}
                frame={imageFrame}
                className="aspect-[4/5] rounded-[var(--radius)] shadow-lg bg-[var(--color-background)]"
              />
            </div>
          )}

          <div className={hasImage ? "" : "max-w-3xl mx-auto"}>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--color-text)] leading-tight mb-5">
              {title}
            </h2>
            {intro && (
              <p className="text-base md:text-lg text-[var(--color-text-muted)] leading-relaxed mb-6">
                {intro}
              </p>
            )}
            <div className="space-y-5">
              {paragraphs.map((p, i) => (
                <div key={i}>
                  {p.heading && (
                    <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">
                      {p.heading}
                    </h3>
                  )}
                  <p className="text-sm md:text-base text-[var(--color-text-muted)] leading-relaxed">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </SectionShell>
  );
}
