import Container from "@/components/layout/Container";

interface FooterSectionProps {
  storeName: string;
  contactEmail: string;
  links: { label: string; href: string }[];
}

export default function FooterSection({ storeName, contactEmail, links }: FooterSectionProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-primary)] text-white/80 py-10">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="font-semibold text-white text-sm">{storeName}</p>
            <p className="text-xs mt-1">&copy; {year} {storeName}. Wszelkie prawa zastrzeżone.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.href}
                className="hover:text-white transition-colors underline-offset-2 hover:underline"
              >
                {link.label}
              </a>
            ))}
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="hover:text-white transition-colors underline-offset-2 hover:underline"
              >
                {contactEmail}
              </a>
            )}
          </div>
        </div>
      </Container>
    </footer>
  );
}
