# Storefront Template

Config-driven one-product storefront template for **ecommerce-flow.ai**. Built with Next.js (App Router), TypeScript, Tailwind CSS, and Zod.

Layout is driven by config using a **pages / sections / blocks** model. One private repo serves many stores — each Vercel deployment fetches its unique runtime config from the ecommerce-flow backend API.

## Quick Start (Local Mode)

```bash
npm install
npm run dev
```

Open http://localhost:3000. The demo storefront renders from `config/storefront.config.json`.

## Runtime Contract

The storefront renders from a config with this structure:

```
StorefrontConfig
├── theme          — colors, radius, shadow, spacing
├── branding       — storeName, productName, tagline, language
├── pages[]        — array of pages (currently HOME)
│   └── sections[] — ordered array of page sections
│       ├── id, type, position
│       ├── settings{}    — section-level data (title, headline, etc.)
│       └── blocks[]      — repeatable items within the section
│           ├── id, type
│           └── settings{} — block-level data (text, name, quote, etc.)
├── commerce       — WooCommerce integration settings
└── analytics      — analytics provider settings
```

### Section Types

| Type | Component | Description |
|---|---|---|
| `ANNOUNCEMENT_BAR` | AnnouncementBar | Top banner with promo text |
| `HERO` | HeroSection | Headline, CTA, product image, benefit bullets (blocks) |
| `TRUST_BAR` | TrustBarSection | Trust indicators (blocks) |
| `BENEFITS` | BenefitsSection | Benefit cards grid (blocks) |
| `PROBLEM` | ProblemSection | Problem framing with pain points (blocks) |
| `FEATURES` | FeaturesSection | Numbered feature list (blocks) |
| `COMPARISON` | ComparisonSection | Us vs. them comparison table (blocks) |
| `TESTIMONIALS` | TestimonialsSection | Customer review cards (blocks) |
| `OFFER` | OfferSection | Pricing card with CTA, included items (blocks) |
| `FAQ` | FaqSection | Accordion FAQ items (blocks) |
| `CTA` | FinalCtaSection | Closing call-to-action section |
| `FOOTER` | FooterSection | Footer links (blocks) and contact email |

### How Sections Use Blocks

Sections have `settings` for section-level data (title, description) and `blocks[]` for repeatable items:

```json
{
  "id": "faq-1",
  "type": "FAQ",
  "position": 9,
  "settings": { "title": "Frequently Asked Questions" },
  "blocks": [
    { "id": "q1", "type": "faq_item", "settings": { "question": "...", "answer": "..." } },
    { "id": "q2", "type": "faq_item", "settings": { "question": "...", "answer": "..." } }
  ]
}
```

## Config Loading Modes

### Local Mode (default)

- **Trigger:** `STORE_ID` env var is not set
- **Source:** `config/storefront.config.json`
- **Behavior:** Static pre-rendering at build time

### Remote Runtime Mode

- **Trigger:** `STORE_ID` env var is set
- **Source:** `GET ${STOREFRONT_API_URL}/storefront-runtime/${STORE_ID}`
- **Behavior:** ISR with 60-second revalidation

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `STORE_ID` | No | — | Enables remote mode. |
| `STOREFRONT_API_URL` | No | `https://api.ecommerce-flow.ai` | Backend API base URL. |

## Page Rendering Flow

```
getStorefrontConfig()
  → loadActiveStorefrontConfig()
      → localConfigProvider OR remoteConfigProvider
          → validate with Zod schema
          → return StorefrontConfig

app/layout.tsx
  → reads config.branding and config.theme
  → applies CSS variables via buildThemeVariables()

app/page.tsx
  → resolveHomePage(config) — finds the HOME page
  → sorts sections by position
  → renderSection(section, context) for each section
      → maps section.type to component
      → passes section.settings + section.blocks as props
```

## Theme System

Theme drives CSS custom properties applied to `<body>`:

```json
{
  "theme": {
    "accentColor": "#6366f1",
    "radius": "xl",
    "shadow": "soft"
  }
}
```

`buildThemeVariables()` converts these to `--color-accent`, `--radius`, `--shadow`, etc.

## Commerce Integration

WooCommerce add-to-cart redirect flow:

```json
{
  "commerce": {
    "provider": "woocommerce",
    "storeUrl": "https://store.example.com",
    "productId": "101",
    "checkoutMode": "ADD_TO_CART_REDIRECT",
    "ctaButtonLabel": "Buy now"
  }
}
```

CTA buttons in OFFER and CTA sections link to the constructed WooCommerce URL.

## Adding / Editing a Page

1. Open `config/storefront.config.json`
2. Find the `pages` array
3. Edit or add sections inside `pages[0].sections`
4. Each section needs: `id`, `type`, `position`, `settings`, `blocks`
5. Add blocks for repeatable items (FAQ questions, testimonials, benefits, etc.)

To reorder sections, change `position` values. To hide a section, remove it from the array.

## Project Structure

```
app/
  layout.tsx              # Reads branding + theme, applies CSS variables
  page.tsx                # Resolves HOME page, renders sections
  globals.css
  store-not-found/        # Error: store ID not found
  store-unavailable/      # Error: API unreachable
  config-error/           # Error: invalid config

components/
  sections/               # 12 section components
  layout/                 # Container, SectionShell
  ui/                     # Button, Badge, Card, SectionHeading
  AnalyticsInit.tsx

config/
  storefront.config.json  # Local demo config

lib/
  config/
    providers/
      loadActiveStorefrontConfig.ts
      localConfigProvider.ts
      remoteConfigProvider.ts
    getStorefrontConfig.ts  # React cache() wrapper
    schema.ts               # Zod schema (runtime contract)
  commerce/                 # WooCommerce provider
  analytics/                # Event tracking abstraction
  storefront/
    buildThemeVariables.ts  # Theme → CSS variables
    resolveHomePage.ts      # Finds HOME page from config
    renderSection.tsx       # Section type → component mapper
  utils/

types/
  storefront.ts             # TypeScript types

public/images/
.env.example
```

## Tech Stack

- **Next.js 16** (App Router, async Server Components)
- **TypeScript**
- **Tailwind CSS v4**
- **Zod** for config validation
- **React cache()** for request-scoped deduplication
