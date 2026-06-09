"use client";

import { useState } from "react";
import Container from "@/components/layout/Container";
import SectionShell, { type ShellOverride } from "@/components/layout/SectionShell";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/storefront/Reveal";
import { trackFaqOpen } from "@/lib/analytics/tracking";

interface FaqSectionProps {
  title: string;
  items: { question: string; answer: string }[];
  shellOverride?: ShellOverride;
}

export default function FaqSection({ title, items, shellOverride }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(i: number) {
    if (openIndex !== i) {
      trackFaqOpen(items[i].question);
    }
    setOpenIndex(openIndex === i ? null : i);
  }

  return (
    <SectionShell background="surface" override={shellOverride}>
      <Container narrow>
        <SectionHeading title={title} />
        <div className="space-y-3">
          {items.map((item, i) => (
            <Reveal
              key={i}
              index={i}
              className={`bg-[var(--color-background)] border rounded-[var(--radius)] overflow-hidden transition-all duration-200 ${
                openIndex === i
                  ? "border-[var(--color-accent)]/40 shadow-md"
                  : "border-[var(--color-border)] shadow-[var(--shadow)] hover:border-[var(--color-accent)]/25"
              }`}
            >
              <button
                onClick={() => toggle(i)}
                aria-expanded={openIndex === i}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
              >
                <span className="font-medium text-[var(--color-text)] text-sm md:text-base">
                  {item.question}
                </span>
                <span
                  className={`flex w-7 h-7 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                    openIndex === i
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] rotate-180"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {openIndex === i && (
                <div className="border-t border-[var(--color-border)] px-5 py-4 text-sm text-[var(--color-text-muted)] leading-relaxed">
                  {item.answer}
                </div>
              )}
            </Reveal>
          ))}
        </div>
      </Container>
    </SectionShell>
  );
}
