import { z } from "zod";

const ctaSchema = z.object({
  label: z.string(),
  href: z.string().optional(),
});

const priceSchema = z.object({
  amount: z.number(),
  currency: z.string().default("PLN"),
  compareAtAmount: z.number().nullable().optional(),
});

const DEFAULT_PALETTE = {
  background: "#ffffff",
  surface: "#f8fafc",
  primary: "#0f172a",
  accent: "#0ea5e9",
  accentSoft: "#e0f2fe",
  success: "#16a34a",
  warning: "#f59e0b",
  text: "#111827",
  textMuted: "#6b7280",
  border: "#e5e7eb",
} as const;

const DEFAULT_STYLE = {
  radius: "xl" as const,
  shadow: "soft" as const,
  spacing: "comfortable" as const,
  heroVariant: "split-image" as const,
  buttonVariant: "rounded-solid" as const,
};

const paletteSchema = z.object({
  background: z.string().default(DEFAULT_PALETTE.background),
  surface: z.string().default(DEFAULT_PALETTE.surface),
  primary: z.string().default(DEFAULT_PALETTE.primary),
  accent: z.string().default(DEFAULT_PALETTE.accent),
  accentSoft: z.string().default(DEFAULT_PALETTE.accentSoft),
  success: z.string().default(DEFAULT_PALETTE.success),
  warning: z.string().default(DEFAULT_PALETTE.warning),
  text: z.string().default(DEFAULT_PALETTE.text),
  textMuted: z.string().default(DEFAULT_PALETTE.textMuted),
  border: z.string().default(DEFAULT_PALETTE.border),
});

const styleSchema = z.object({
  radius: z.enum(["none", "sm", "md", "lg", "xl", "full"]).default(DEFAULT_STYLE.radius),
  shadow: z.enum(["none", "soft", "medium", "strong"]).default(DEFAULT_STYLE.shadow),
  spacing: z.enum(["compact", "comfortable", "spacious"]).default(DEFAULT_STYLE.spacing),
  heroVariant: z.enum(["split-image", "centered", "full-bleed"]).default(DEFAULT_STYLE.heroVariant),
  buttonVariant: z.enum(["rounded-solid", "sharp-solid", "rounded-outline", "pill"]).default(DEFAULT_STYLE.buttonVariant),
});

const sectionEntrySchema = z.object({
  type: z.enum([
    "announcementBar",
    "hero",
    "trustBar",
    "benefits",
    "problem",
    "features",
    "comparison",
    "testimonials",
    "offer",
    "faq",
    "finalCta",
    "footer",
  ]),
  enabled: z.boolean().default(true),
});

export const storefrontConfigSchema = z.object({
  meta: z.object({
    schemaVersion: z.string().default("1.0"),
    templateKey: z.string().default("one-product-dtc"),
    templateVersion: z.string().default("1.0"),
  }),
  brand: z.object({
    brandName: z.string(),
    productName: z.string(),
    tagline: z.string().optional().default(""),
    language: z.string().default("pl"),
    tone: z.string().default("premium-calm"),
  }),
  theme: z.object({
    palette: paletteSchema.default(DEFAULT_PALETTE),
    style: styleSchema.default(DEFAULT_STYLE),
  }).default({ palette: DEFAULT_PALETTE, style: DEFAULT_STYLE }),
  product: z.object({
    name: z.string(),
    category: z.string().optional().default(""),
    price: priceSchema,
    primaryImage: z.string(),
    gallery: z.array(z.string()).default([]),
    badges: z.array(z.string()).default([]),
  }),
  hero: z.object({
    eyebrow: z.string().optional().default(""),
    headline: z.string(),
    subheadline: z.string().optional().default(""),
    primaryCta: ctaSchema,
    secondaryCta: ctaSchema.optional(),
    benefitBullets: z.array(z.string()).default([]),
  }),
  announcementBar: z.object({
    enabled: z.boolean().default(true),
    text: z.string(),
  }).optional(),
  trustBar: z.object({
    items: z.array(z.string()).default([]),
  }).optional(),
  benefits: z.object({
    title: z.string(),
    items: z.array(z.object({
      title: z.string(),
      description: z.string(),
    })).default([]),
  }).optional(),
  problem: z.object({
    title: z.string(),
    description: z.string(),
    painPoints: z.array(z.string()).default([]),
  }).optional(),
  features: z.object({
    title: z.string(),
    items: z.array(z.object({
      name: z.string(),
      description: z.string(),
    })).default([]),
  }).optional(),
  comparison: z.object({
    title: z.string(),
    rows: z.array(z.object({
      label: z.string(),
      ours: z.string(),
      other: z.string(),
    })).default([]),
  }).optional(),
  testimonials: z.object({
    title: z.string(),
    items: z.array(z.object({
      name: z.string(),
      quote: z.string(),
      avatar: z.string().optional(),
    })).default([]),
  }).optional(),
  offer: z.object({
    anchorId: z.string().default("offer"),
    title: z.string(),
    priceLabel: z.string().optional().default(""),
    cta: ctaSchema,
    included: z.array(z.string()).default([]),
    guaranteeText: z.string().optional().default(""),
  }).optional(),
  faq: z.object({
    title: z.string(),
    items: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).default([]),
  }).optional(),
  finalCta: z.object({
    headline: z.string(),
    subheadline: z.string().optional().default(""),
    buttonLabel: z.string(),
  }).optional(),
  footer: z.object({
    links: z.array(z.object({
      label: z.string(),
      href: z.string(),
    })).default([]),
    contactEmail: z.string().optional().default(""),
  }).optional(),
  commerce: z.object({
    provider: z.enum(["woocommerce", "shopify", "custom"]).default("woocommerce"),
    woocommerce: z.object({
      storeUrl: z.string(),
      productId: z.number(),
      variationId: z.number().nullable().optional(),
      productUrl: z.string().optional(),
      checkoutMode: z.enum(["add_to_cart_redirect", "direct_checkout"]).default("add_to_cart_redirect"),
    }).optional(),
    cta: z.object({
      buttonLabel: z.string().default("Kup teraz"),
      showQuantitySelector: z.boolean().default(false),
    }).default({ buttonLabel: "Kup teraz", showQuantitySelector: false }),
  }),
  analytics: z.object({
    provider: z.string().default("custom"),
    enabled: z.boolean().default(true),
  }).default({ provider: "custom", enabled: true }),
  sections: z.array(sectionEntrySchema).default([]),
});
