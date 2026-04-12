"use client";

import { create } from "zustand";
import type { SectionType } from "@/types/storefront";

export interface SectionEntry {
  id: string;
  label: string;
  order: number;
  /** Raw section type — used by the desktop inline nav to look up
   *  well-known slots (HERO → Produkt, TESTIMONIALS → Opinie, …) without
   *  hard-coding section ids. */
  type: SectionType;
}

/**
 * Registry of navigable page sections. Sections are registered at render
 * time (via RegisterSections) and consumed by the NavigationDrawer and
 * HeaderNavLinks, which display them sorted by `order`.
 */
interface SectionRegistryState {
  sections: SectionEntry[];
  setSections: (sections: SectionEntry[]) => void;
  clearSections: () => void;
}

export const useSectionRegistry = create<SectionRegistryState>((set) => ({
  sections: [],
  setSections: (sections) => set({ sections }),
  clearSections: () => set({ sections: [] }),
}));
