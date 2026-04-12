import Container from "@/components/layout/Container";
import SectionShell from "@/components/layout/SectionShell";

interface ExpertSectionProps {
  title: string;
  description: string;
  expertName: string;
  expertRole?: string;
  expertImage?: string;
  videoUrl?: string;
  quote?: string;
}

export default function ExpertSection({
  title,
  description,
  expertName,
  expertRole,
  expertImage,
  videoUrl,
  quote,
}: ExpertSectionProps) {
  return (
    <SectionShell>
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Video / image — prefer video, fall back to expert portrait */}
          <div className="order-2 lg:order-1">
            {videoUrl ? (
              <div className="aspect-video rounded-[var(--radius)] overflow-hidden bg-black shadow-lg">
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full object-cover"
                  poster={expertImage}
                  playsInline
                />
              </div>
            ) : expertImage ? (
              <div className="aspect-square max-w-md mx-auto rounded-[var(--radius)] overflow-hidden bg-[var(--color-surface)] shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={expertImage}
                  alt={expertName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <p className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-wider mb-3">
              Opinia eksperta
            </p>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--color-text)] leading-tight mb-4">
              {title}
            </h2>
            <p className="text-base text-[var(--color-text-muted)] leading-relaxed mb-5">
              {description}
            </p>

            {quote && (
              <blockquote className="border-l-4 border-[var(--color-accent)] pl-4 italic text-base text-[var(--color-text)] mb-5">
                &ldquo;{quote}&rdquo;
              </blockquote>
            )}

            {/* Expert byline */}
            <div className="flex items-center gap-3">
              {expertImage && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={expertImage}
                  alt={expertName}
                  className="w-12 h-12 rounded-full object-cover bg-[var(--color-accent-soft)]"
                />
              )}
              <div>
                <p className="font-semibold text-[var(--color-text)] text-sm">{expertName}</p>
                {expertRole && (
                  <p className="text-xs text-[var(--color-text-muted)]">{expertRole}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </SectionShell>
  );
}
