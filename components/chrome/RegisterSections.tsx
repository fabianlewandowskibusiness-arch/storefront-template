"use client";

import { useEffect } from "react";
import {
  useSectionRegistry,
  type SectionEntry,
} from "@/lib/stores/sectionRegistry";

interface RegisterSectionsProps {
  sections: SectionEntry[];
}

/**
 * Pushes the server-computed navigable-section list into the client-side
 * registry on mount. Clears the registry on unmount so page transitions
 * don't leave stale entries behind.
 *
 * Renders nothing — it's purely a side-effect component.
 */
export default function RegisterSections({ sections }: RegisterSectionsProps) {
  const setSections = useSectionRegistry((s) => s.setSections);
  const clearSections = useSectionRegistry((s) => s.clearSections);

  useEffect(() => {
    setSections(sections);
    return () => clearSections();
  }, [sections, setSections, clearSections]);

  return null;
}
