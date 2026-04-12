"use client";

import { useState } from "react";
import Container from "@/components/layout/Container";
import SectionShell, { type ShellOverride } from "@/components/layout/SectionShell";
import SectionHeading from "@/components/ui/SectionHeading";

interface ProblemItem {
  title: string;
  description: string;
}

interface ProblemSectionProps {
  title: string;
  description?: string;
  items: ProblemItem[];
  shellOverride?: ShellOverride;
}

export default function ProblemSection({
  title,
  description,
  items,
  shellOverride,
}: ProblemSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <SectionShell background="surface" override={shellOverride}>
      <Container narrow>
        <SectionHeading title={title} subtitle={description} />
        <div className="space-y-3">
          {items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius)] overflow-hidden shadow-[var(--shadow)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-[var(--color-surface)] transition-colors"
                >
                  <span className="flex items-center gap-3 text-sm md:text-base font-semibold text-[var(--color-text)]">
                    <svg
                      className="w-5 h-5 text-[var(--color-warning)] shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {item.title}
                  </span>
                  <svg
                    className={`w-5 h-5 text-[var(--color-text-muted)] shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && item.description && (
                  <div className="px-5 pb-4 pl-[3.25rem] text-sm text-[var(--color-text-muted)] leading-relaxed">
                    {item.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </SectionShell>
  );
}
