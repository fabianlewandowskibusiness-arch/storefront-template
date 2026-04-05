# Storefront Template

Config-driven one-product storefront template for **ecommerce-flow.ai**. Built with Next.js (App Router), TypeScript, Tailwind CSS, and Zod.

Designed as a production-ready template engine: one private repo serves many stores. Each deployment reads its config either from a local file (development) or from the ecommerce-flow.ai backend API (production).

## Quick Start (Local Mode)

```bash
npm install
npm run dev
```

Open http://localhost:3000. The demo storefront renders from `config/storefront.config.json`.

## Config Loading Modes

The storefront supports two config loading modes, selected automatically based on environment variables.

### Local Mode (default)

Used for development, demos, and testing. No external API required.

- **Trigger:** `STORE_ID` env var is not set
- **Source:** `config/storefront.config.json`
- **Behavior:** Static pre-rendering at build time

```bash
# Just run — no env vars needed
npm run dev
```

### Remote Runtime Mode

Used for production Vercel deployments. One repo serves many stores.

- **Trigger:** `STORE_ID` env var is set
- **Source:** `GET ${STOREFRONT_API_URL}/storefront-runtime/${STORE_ID}`
- **Behavior:** ISR with 60-second revalidation

```bash
# Set in .env.local or Vercel project settings
STORE_ID=abc123
STOREFRONT_API_URL=https://api.ecommerce-flow.ai
```

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `STORE_ID` | No | — | Enables remote mode. Unique store identifier. |
| `STOREFRONT_API_URL` | No | `https://api.ecommerce-flow.ai` | Backend API base URL. |

See `.env.example` for reference.

## Config Loading Pipeline

```
loadActiveStorefrontConfig()
  |
  ├── STORE_ID set? ──yes──> remoteConfigProvider
  |                            ├── fetch(API + STORE_ID, revalidate: 60)
  |                            ├── handle 404 → /store-not-found
  |                            ├── handle network error → /store-unavailable
  |                            ├── validate with Zod schema
  |                            ├── handle validation error → /config-error
  |                            └── normalize defaults
  |
  └── STORE_ID unset? ──> localConfigProvider
                            ├── import config/storefront.config.json
                            ├── validate with Zod schema
                            └── normalize defaults
```

Key files:

- `lib/config/providers/loadActiveStorefrontConfig.ts` — Unified entry point, selects provider
- `lib/config/providers/localConfigProvider.ts` — Loads from local JSON file
- `lib/config/providers/remoteConfigProvider.ts` — Fetches from backend API with caching
- `lib/config/getStorefrontConfig.ts` — React `cache()` wrapper for request deduplication
- `lib/config/schema.ts` — Zod schema (contract between AI generator and template)
- `lib/config/normalizeStorefrontConfig.ts` — Applies defaults, disables sections lacking data

### Request Deduplication

Both `layout.tsx` and `page.tsx` call `getStorefrontConfig()`. This function is wrapped with React's `cache()`, which deduplicates calls within a single server render pass. The config is fetched once per request, not twice.

### Caching Strategy (Remote Mode)

Remote config uses Next.js ISR:

```ts
fetch(url, { next: { revalidate: 60 } })
```

- First request after deploy fetches from API and caches the result
- Subsequent requests within 60 seconds serve the cached version
- After 60 seconds, Next.js revalidates in the background
- Config updates propagate without redeployment

### Error Handling (Remote Mode)

| Scenario | Behavior |
|---|---|
| API returns 404 | Redirect to `/store-not-found` |
| Network/server error | Redirect to `/store-unavailable` |
| Invalid JSON or schema validation failure | Redirect to `/config-error` |

Error pages are minimal, self-contained, and render without config.

## Architecture: One Repo, Many Stores

```
┌─────────────────────┐
│  storefront-template │  (this repo — one private repo)
│  (Next.js + Tailwind)│
└──────────┬──────────┘
           │
     Vercel deploys
           │
   ┌───────┼───────┐
   │       │       │
   v       v       v
 Store A  Store B  Store C   (each a Vercel project)
 STORE_ID STORE_ID STORE_ID
   │       │       │
   └───────┼───────┘
           │
           v
  ecommerce-flow.ai API
  GET /storefront-runtime/{STORE_ID}
```

Each store:
- Shares the same codebase
- Has its own Vercel project with `STORE_ID` env var
- Fetches its unique config from the backend API at runtime
- Renders a fully customized storefront

## Section Rendering

The config `sections[]` array controls which sections render and in what order:

```json
{
  "sections": [
    { "type": "announcementBar", "enabled": true },
    { "type": "hero", "enabled": true },
    { "type": "trustBar", "enabled": true }
  ]
}
```

`lib/storefront/renderSection.tsx` maps each type to its component. Only enabled sections render.

**Supported section types (v1):**
announcementBar, hero, trustBar, benefits, problem, features, comparison, testimonials, offer, faq, finalCta, footer

## Theme System

The `theme` block drives CSS custom properties applied to `<body>`:

```json
{
  "theme": {
    "palette": { "accent": "#6366f1", ... },
    "style": { "radius": "xl", "shadow": "soft", ... }
  }
}
```

`lib/storefront/buildThemeVariables.ts` converts these to CSS variables consumed by all components.

## WooCommerce Integration

Commerce integration uses add-to-cart redirect:

1. Config specifies WooCommerce store URL, product ID, checkout mode
2. `lib/commerce/woocommerce.ts` constructs the add-to-cart URL
3. CTA buttons link to this URL
4. WooCommerce handles cart, checkout, payment

## Analytics Abstraction

`lib/analytics/tracking.ts` provides: `trackPageView`, `trackHeroCtaClick`, `trackOfferCtaClick`, `trackFinalCtaClick`, `trackFaqOpen`, `trackBeginCheckout`.

Events log to console in development. `window.__analytics_handler` hook for vendor SDKs.

## Project Structure

```
app/
  layout.tsx              # Async root layout, loads config, applies theme
  page.tsx                # Async homepage, renders sections from config
  globals.css             # CSS reset and custom property defaults
  store-not-found/        # Error page: store ID not found (404)
  store-unavailable/      # Error page: API unreachable
  config-error/           # Error page: invalid config

components/
  layout/                 # Container, SectionShell
  sections/               # All 12 section components
  ui/                     # Button, Badge, Card, SectionHeading
  AnalyticsInit.tsx       # Client component for analytics init

config/
  storefront.config.json  # Local demo config (used in local mode only)

lib/
  config/
    providers/
      loadActiveStorefrontConfig.ts   # Unified loader (selects provider)
      localConfigProvider.ts          # Loads from local JSON
      remoteConfigProvider.ts         # Fetches from backend API
    getStorefrontConfig.ts            # React cache() wrapper — single entry point
    schema.ts                         # Zod schema (config contract)
    normalizeStorefrontConfig.ts      # Defaults and section normalization
  commerce/               # Provider abstraction, WooCommerce
  analytics/              # Event types and tracking
  storefront/             # Theme builder, section renderer
  utils/                  # cn(), formatPrice()

types/
  storefront.ts           # TypeScript types from Zod schema

public/images/            # Product and avatar placeholders
.env.example              # Environment variable reference
```

## Deployment

**Local/demo:**
```bash
npm run build   # Static pre-rendering
```

**Production (Vercel):**
Set `STORE_ID` and optionally `STOREFRONT_API_URL` in Vercel project settings. Deploy. The storefront fetches config from the API at runtime with ISR caching.

## Tech Stack

- **Next.js 16** (App Router, async Server Components)
- **TypeScript**
- **Tailwind CSS v4**
- **Zod** for config validation
- **React cache()** for request-scoped deduplication
