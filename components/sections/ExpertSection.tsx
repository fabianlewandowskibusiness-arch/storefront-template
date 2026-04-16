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
          {/* Video / image — prefer video, fall back to expert portrait.
              Missing-media fallback: when both `videoUrl` and `expertImage`
              are absent (canonical contract allows `expertImage` to be
              `null`), we render a branded initials placeholder so the
              two-column grid stays balanced. See lib/storefront/mediaFields.ts. */}
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
            ) : (
              <ExpertPortraitPlaceholder name={expertName} />
            )}
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

            {/* Expert byline.
                Missing-media fallback: if `expertImage` is `null`, we render
                an initial-letter circle to keep the byline visually balanced
                (mirrors the TestimonialsCarousel avatar fallback). */}
            <div className="flex items-center gap-3">
              {expertImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={expertImage}
                  alt={expertName}
                  className="w-12 h-12 rounded-full object-cover bg-[var(--color-accent-soft)]"
                />
              ) : (
                <ExpertInitialCircle name={expertName} />
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

// ── Missing-media fallbacks ──────────────────────────────────────────────────
//
// Rendered when `expertImage` and `videoUrl` are both absent (or when only
// the avatar-sized slot is empty). Uses the storefront's existing accent-soft
// gradient so the empty state reads as a deliberate branded placeholder rather
// than a layout accident. Contains no data — presentation only.

function expertInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const initials = parts.map((p) => p.charAt(0).toUpperCase()).join("");
  return initials || "?";
}

function ExpertPortraitPlaceholder({ name }: { name: string }) {
  return (
    <div
      role="img"
      aria-label={name || "Portret eksperta"}
      className="aspect-square max-w-md mx-auto rounded-[var(--radius)] bg-gradient-to-br from-[var(--color-accent-soft)] to-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shadow-lg"
    >
      <span className="text-6xl font-extrabold tracking-tight text-[var(--color-accent)]/80">
        {expertInitials(name)}
      </span>
    </div>
  );
}

function ExpertInitialCircle({ name }: { name: string }) {
  return (
    <div
      aria-hidden="true"
      className="w-12 h-12 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center text-[var(--color-accent)] font-bold text-base"
    >
      {expertInitials(name)}
    </div>
  );
}
