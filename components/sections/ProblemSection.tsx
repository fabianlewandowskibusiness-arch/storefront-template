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
                className={`rounded-[var(--radius)] border bg-[var(--color-background)] overflow-hidden transition-all duration-200 ${
                  isOpen
                    ? "border-[var(--color-warning)]/40 shadow-md"
                    : "border-[var(--color-border)] shadow-[var(--shadow)] hover:border-[var(--color-warning)]/25"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="group w-full text-left px-5 py-4 flex items-center justify-between gap-3"
                >
                  <span className="flex items-center gap-3 text-sm md:text-base font-semibold text-[var(--color-text)]">
                    {/* Warning icon chip */}
                    <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-warning)]/10 text-[var(--color-warning)]">
                      <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    <span className="min-w-0">{item.title}</span>
                  </span>
                  {/* Chevron in a chip — fills in when open */}
                  <span
                    className={`flex w-7 h-7 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                      isOpen
                        ? "bg-[var(--color-warning)]/10 text-[var(--color-warning)] rotate-180"
                        : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                {isOpen && item.description && (
                  <div className="border-t border-[var(--color-border)] px-5 py-4 text-sm text-[var(--color-text-muted)] leading-relaxed">
                    <span className="block pl-11">{item.description}</span>
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
