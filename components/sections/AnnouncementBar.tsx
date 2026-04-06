interface AnnouncementBarProps {
  text: string;
}

export default function AnnouncementBar({ text }: AnnouncementBarProps) {
  if (!text) return null;

  return (
    <div className="bg-[var(--color-accent)] text-white text-center py-2.5 px-4 text-sm font-medium tracking-wide">
      {text}
    </div>
  );
}
