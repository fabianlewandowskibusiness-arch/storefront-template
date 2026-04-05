interface AnnouncementBarProps {
  config: {
    enabled: boolean;
    text: string;
  };
}

export default function AnnouncementBar({ config }: AnnouncementBarProps) {
  if (!config.enabled) return null;

  return (
    <div className="bg-[var(--color-accent)] text-white text-center py-2.5 px-4 text-sm font-medium tracking-wide">
      {config.text}
    </div>
  );
}
