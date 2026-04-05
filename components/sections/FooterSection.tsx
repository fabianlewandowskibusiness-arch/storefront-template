import Container from "@/components/layout/Container";

interface FooterSectionProps {
  config: {
    links: { label: string; href: string }[];
    contactEmail: string;
  };
  brand: {
    brandName: string;
    productName: string;
  };
}

export default function FooterSection({ config, brand }: FooterSectionProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-primary)] text-white/80 py-10">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <p className="font-semibold text-white text-sm">{brand.brandName}</p>
            <p className="text-xs mt-1">&copy; {year} {brand.brandName}. Wszelkie prawa zastrzezone.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs">
            {config.links.map((link, i) => (
              <a
                key={i}
                href={link.href}
                className="hover:text-white transition-colors underline-offset-2 hover:underline"
              >
                {link.label}
              </a>
            ))}
            {config.contactEmail && (
              <a
                href={`mailto:${config.contactEmail}`}
                className="hover:text-white transition-colors underline-offset-2 hover:underline"
              >
                {config.contactEmail}
              </a>
            )}
          </div>
        </div>
      </Container>
    </footer>
  );
}
