import AnnouncementTicker from "@/components/storefront/AnnouncementTicker";

interface AnnouncementStripProps {
  items: string[];
}

/**
 * Chrome-level announcement strip. Sits above the sticky header and
 * scrolls away with the page. Delegates to the existing ticker when
 * there are 2+ items; single-item falls back to a static strip to
 * avoid an unnecessary marquee animation.
 *
 * Renders nothing when there are no items, so the chrome degrades
 * gracefully for stores that never configure one.
 */
export default function AnnouncementStrip({ items }: AnnouncementStripProps) {
  if (items.length === 0) return null;

  if (items.length === 1) {
    return (
      <div className="bg-[var(--color-accent)] text-white text-center py-2 px-4 text-xs md:text-sm font-medium tracking-wide">
        {items[0]}
      </div>
    );
  }

  return <AnnouncementTicker items={items} />;
}
