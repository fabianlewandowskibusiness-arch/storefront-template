import AnnouncementTicker from "@/components/storefront/AnnouncementTicker";

interface AnnouncementBarProps {
  /** Legacy single-line text. Still supported as a fallback. */
  text?: string;
  /** Preferred: array of rotating messages. Rendered as an infinite marquee. */
  items?: string[];
}

export default function AnnouncementBar({ text, items = [] }: AnnouncementBarProps) {
  // Prefer the ticker when we have multiple items.
  const messages = items.length > 0 ? items : text ? [text] : [];
  if (messages.length === 0) return null;

  // 2+ messages → marquee. Single message → static bar (cheaper, no layout).
  if (messages.length >= 2) {
    return <AnnouncementTicker items={messages} />;
  }

  return (
    <div className="bg-[var(--color-accent)] text-white text-center py-2.5 px-4 text-sm font-medium tracking-wide">
      {messages[0]}
    </div>
  );
}
