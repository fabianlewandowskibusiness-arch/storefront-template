"use client";

import { useState } from "react";
import Container from "@/components/layout/Container";
import SectionShell from "@/components/layout/SectionShell";
import SectionHeading from "@/components/ui/SectionHeading";
import { trackFaqOpen } from "@/lib/analytics/tracking";

interface FaqSectionProps {
  config: {
    title: string;
    items: { question: string; answer: string }[];
  };
}

export default function FaqSection({ config }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(i: number) {
    if (openIndex !== i) {
      trackFaqOpen(config.items[i].question);
    }
    setOpenIndex(openIndex === i ? null : i);
  }

  return (
    <SectionShell background="surface">
      <Container narrow>
        <SectionHeading title={config.title} />
        <div className="space-y-3">
          {config.items.map((item, i) => (
            <div
              key={i}
              className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow)]"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-[var(--color-surface)] transition-colors"
              >
                <span className="font-medium text-[var(--color-text)] text-sm md:text-base">
                  {item.question}
                </span>
                <svg
                  className={`w-5 h-5 text-[var(--color-text-muted)] shrink-0 transition-transform duration-200 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="px-5 pb-4 text-sm text-[var(--color-text-muted)] leading-relaxed">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </SectionShell>
  );
}
