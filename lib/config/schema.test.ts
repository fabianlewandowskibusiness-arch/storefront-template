import { describe, it, expect } from "vitest";
import { storefrontConfigSchema } from "./schema";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Minimal structurally-valid config — only the truly required fields are set. */
function minimalConfig(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    branding: { storeName: "TestStore", productName: "TestProduct" },
    pages: [{ type: "HOME", title: "Home", slug: "/", sections: [] }],
    theme: {},
    ...overrides,
  };
}

function parseOk(input: unknown) {
  const result = storefrontConfigSchema.safeParse(input);
  if (!result.success) {
    const msg = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Expected parse to succeed but got:\n${msg}`);
  }
  return result.data;
}

function parseFail(input: unknown): void {
  const result = storefrontConfigSchema.safeParse(input);
  expect(result.success, "Expected parse to fail but it succeeded").toBe(false);
}

// ── Minimal valid config ───────────────────────────────────────────────────────

describe("minimal config", () => {
  it("parses with only required fields — all defaults are applied", () => {
    const config = parseOk(minimalConfig());
    expect(config.branding.storeName).toBe("TestStore");
    expect(config.branding.productName).toBe("TestProduct");
    // Defaults applied for optional/defaultable fields:
    expect(config.branding.language).toBe("pl");
    expect(config.branding.logoUrl).toBe("");
    expect(config.branding.tagline).toBe("");
    expect(config.theme.primaryColor).toBe("#0f172a");
    expect(config.theme.fontPreset).toBe("modern");
    expect(config.analytics.provider).toBe("custom");
    expect(config.analytics.enabled).toBe(true);
  });

  it("parses when commerce is absent (no WooCommerce configured yet)", () => {
    const config = parseOk(minimalConfig());
    expect(config.commerce == null).toBe(true);
  });

  it("parses when seo is absent (pre-SEO config)", () => {
    const config = parseOk(minimalConfig());
    expect(config.seo == null).toBe(true);
  });
});

// ── Theme null-tolerance ──────────────────────────────────────────────────────

describe("theme: null-tolerance", () => {
  it("null theme tokens are coerced to hardcoded defaults", () => {
    const config = parseOk(minimalConfig({
      theme: {
        primaryColor:    null,
        backgroundColor: null,
        accentColor:     null,
        radius:          null,
        fontPreset:      null,
        spacing:         null,
      },
    }));
    expect(config.theme.primaryColor).toBe("#0f172a");
    expect(config.theme.backgroundColor).toBe("#ffffff");
    expect(config.theme.accentColor).toBe("#6366f1");
    expect(config.theme.radius).toBe("xl");
    expect(config.theme.fontPreset).toBe("modern");
    expect(config.theme.spacing).toBe("comfortable");
  });

  it("absent theme tokens (empty theme object) get defaults", () => {
    const config = parseOk(minimalConfig({ theme: {} }));
    expect(config.theme.primaryColor).toBe("#0f172a");
    expect(config.theme.textColor).toBe("#111827");
    expect(config.theme.shadow).toBe("soft");
    expect(config.theme.fontPreset).toBe("modern");
  });

  it("wrong-type theme tokens (e.g. number) are coerced to defaults", () => {
    // AI might emit a number instead of a hex string
    const config = parseOk(minimalConfig({ theme: { primaryColor: 42 } }));
    expect(config.theme.primaryColor).toBe("#0f172a");
  });

  it("valid theme values are preserved unchanged", () => {
    const config = parseOk(minimalConfig({
      theme: { primaryColor: "#ff0000", fontPreset: "classic" },
    }));
    expect(config.theme.primaryColor).toBe("#ff0000");
    expect(config.theme.fontPreset).toBe("classic");
  });
});

// ── Branding null-tolerance ───────────────────────────────────────────────────

describe("branding: null-tolerance for optional fields", () => {
  it("null logoUrl, faviconUrl, tagline, language are coerced to defaults", () => {
    const config = parseOk(minimalConfig({
      branding: {
        storeName:   "MyShop",
        productName: "MyProduct",
        logoUrl:     null,
        faviconUrl:  null,
        tagline:     null,
        language:    null,
      },
    }));
    expect(config.branding.logoUrl).toBe("");
    expect(config.branding.faviconUrl).toBe("");
    expect(config.branding.tagline).toBe("");
    expect(config.branding.language).toBe("pl");
  });

  it("absent optional branding fields receive defaults", () => {
    const config = parseOk(minimalConfig({
      branding: { storeName: "MyShop", productName: "MyProduct" },
    }));
    expect(config.branding.logoUrl).toBe("");
    expect(config.branding.language).toBe("pl");
  });
});

// ── Commerce null-tolerance ───────────────────────────────────────────────────

describe("commerce: null-tolerance", () => {
  it("null ctaButtonLabel is coerced to 'Kup teraz'", () => {
    const config = parseOk(minimalConfig({
      commerce: {
        provider:       "woocommerce",
        storeUrl:       "https://sklep.pl",
        productUrl:     "https://sklep.pl/product",
        productId:      "1",
        checkoutMode:   "ADD_TO_CART_REDIRECT",
        ctaButtonLabel: null,
      },
    }));
    expect(config.commerce?.ctaButtonLabel).toBe("Kup teraz");
  });

  it("null checkoutMode is coerced to 'ADD_TO_CART_REDIRECT'", () => {
    const config = parseOk(minimalConfig({
      commerce: {
        provider:       "woocommerce",
        storeUrl:       "https://sklep.pl",
        productUrl:     "",
        productId:      "1",
        checkoutMode:   null,
        ctaButtonLabel: "Kup teraz",
      },
    }));
    expect(config.commerce?.checkoutMode).toBe("ADD_TO_CART_REDIRECT");
  });

  it("null storeUrl passes through as null (commerce not yet configured)", () => {
    const config = parseOk(minimalConfig({
      commerce: {
        provider:       "woocommerce",
        storeUrl:       null,
        productUrl:     "",
        productId:      null,
        checkoutMode:   "ADD_TO_CART_REDIRECT",
        ctaButtonLabel: "Kup teraz",
      },
    }));
    expect(config.commerce?.storeUrl).toBeNull();
    expect(config.commerce?.productId).toBeNull();
  });

  it("null commerce (whole field) parses — storefront renders without checkout", () => {
    const config = parseOk(minimalConfig({ commerce: null }));
    expect(config.commerce).toBeNull();
  });

  it("absent commerce parses — storefront renders without checkout", () => {
    const config = parseOk(minimalConfig());
    expect(config.commerce == null).toBe(true);
  });

  it("null productUrl is coerced to empty string", () => {
    const config = parseOk(minimalConfig({
      commerce: {
        provider:       "woocommerce",
        storeUrl:       "https://sklep.pl",
        productUrl:     null,
        productId:      "1",
        checkoutMode:   "ADD_TO_CART_REDIRECT",
        ctaButtonLabel: "Kup teraz",
      },
    }));
    expect(config.commerce?.productUrl).toBe("");
  });
});

// ── SEO null-tolerance ────────────────────────────────────────────────────────

describe("seo: null-tolerance", () => {
  it("null seo (whole field) is accepted", () => {
    const config = parseOk(minimalConfig({ seo: null }));
    expect(config.seo).toBeNull();
  });

  it("absent seo is accepted", () => {
    const config = parseOk(minimalConfig());
    expect(config.seo).toBeUndefined();
  });

  it("null individual seo text fields are accepted (nullish)", () => {
    const config = parseOk(minimalConfig({
      seo: {
        title:         null,
        description:   null,
        ogTitle:       null,
        ogDescription: null,
        ogImage:       null,
        noIndex:       null,
      },
    }));
    expect(config.seo?.title).toBeNull();
    expect(config.seo?.description).toBeNull();
    expect(config.seo?.ogImage).toBeNull();
    expect(config.seo?.noIndex).toBeNull();
  });

  it("partial seo object (only some fields) is accepted", () => {
    const config = parseOk(minimalConfig({
      seo: { title: "My Store Title" },
    }));
    expect(config.seo?.title).toBe("My Store Title");
    expect(config.seo?.description).toBeUndefined();
  });
});

// ── Section null-tolerance ────────────────────────────────────────────────────

describe("sections: null-tolerance", () => {
  it("null section data is accepted — treated as empty data", () => {
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id:       "hero-1",
          type:     "HERO",
          position: 1,
          data:     null,

        }],
      }],
    }));
    expect(config.pages[0].sections[0].data).toBeNull();
  });

  it("null section position is coerced to 0", () => {
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id:       "trust-1",
          type:     "TRUST_BAR",
          position: null,
          data:     {},

        }],
      }],
    }));
    expect(config.pages[0].sections[0].position).toBe(0);
  });

});

// ── Page null-tolerance ───────────────────────────────────────────────────────

describe("pages: null-tolerance", () => {
  it("null page type is coerced to 'UNKNOWN' (does not crash HOME lookup)", () => {
    // The null-type page won't match HOME — resolveHomePage would throw, but
    // the parse itself must succeed.
    const result = storefrontConfigSchema.safeParse({
      branding: { storeName: "S", productName: "P" },
      pages: [
        { type: null, title: "Unknown Page", slug: "/unknown", sections: [] },
        { type: "HOME",  title: "Home",         slug: "/",        sections: [] },
      ],
      theme: {},
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pages[0].type).toBe("UNKNOWN");
      expect(result.data.pages[1].type).toBe("HOME");
    }
  });

  it("null page title and slug are coerced to safe defaults", () => {
    const config = parseOk({
      branding: { storeName: "S", productName: "P" },
      pages: [{ type: "HOME", title: null, slug: null, sections: [] }],
      theme: {},
    });
    expect(config.pages[0].title).toBe("");
    expect(config.pages[0].slug).toBe("/");
  });

  it("absent sections array defaults to []", () => {
    const config = parseOk({
      branding: { storeName: "S", productName: "P" },
      pages: [{ type: "HOME", title: "Home", slug: "/" }],
      theme: {},
    });
    expect(config.pages[0].sections).toEqual([]);
  });
});

// ── Analytics null-tolerance ──────────────────────────────────────────────────

describe("analytics: null-tolerance", () => {
  it("absent analytics receives safe default", () => {
    const config = parseOk(minimalConfig());
    expect(config.analytics.provider).toBe("custom");
    expect(config.analytics.enabled).toBe(true);
  });

  it("null analytics (whole field) receives safe default", () => {
    const config = parseOk(minimalConfig({ analytics: null }));
    expect(config.analytics.provider).toBe("custom");
    expect(config.analytics.enabled).toBe(true);
  });

  it("null inner analytics fields are coerced to defaults", () => {
    const config = parseOk(minimalConfig({
      analytics: { provider: null, enabled: null },
    }));
    expect(config.analytics.provider).toBe("custom");
    expect(config.analytics.enabled).toBe(true);
  });
});

// ── Backward compatibility ────────────────────────────────────────────────────

describe("backward compatibility", () => {
  it("config without seo and analytics (older format) still parses", () => {
    const config = parseOk({
      branding:  { storeName: "OldStore", productName: "OldProduct" },
      pages:     [{ type: "HOME", title: "Home", slug: "/", sections: [] }],
      theme:     { primaryColor: "#123456" },
      commerce:  { storeUrl: "https://s.pl", productId: "1" },
    });
    expect(config.branding.storeName).toBe("OldStore");
    expect(config.seo).toBeUndefined();
    expect(config.analytics.enabled).toBe(true);
  });

  it("legacy heroVariant key in section data passes through validation", () => {
    // Old configs stored heroVariant before _sectionVariant was introduced
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id:       "hero-1",
          type:     "HERO",
          position: 1,
          data:     { heroVariant: "split-image", headline: "Buy now" },

        }],
      }],
    }));
    // data is generic Record<string, unknown> — any key is preserved
    expect(config.pages[0].sections[0].data?.["heroVariant"]).toBe("split-image");
    expect(config.pages[0].sections[0].data?.["headline"]).toBe("Buy now");
  });

  it("media image URL in section data is preserved unchanged by schema", () => {
    const imageUrl = "https://api.example.com/api/storefront/media/abc-123";
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id: "hero-1", type: "HERO", position: 1,
          data: { image: imageUrl },

        }],
      }],
    }));
    expect(config.pages[0].sections[0].data?.["image"]).toBe(imageUrl);
  });
});

// ── Broken critical structure must still fail ─────────────────────────────────

describe("broken critical structure: still rejected", () => {
  it("missing pages fails", () => {
    parseFail({ branding: { storeName: "S", productName: "P" }, theme: {} });
  });

  it("empty pages array fails (min(1) constraint)", () => {
    parseFail(minimalConfig({ pages: [] }));
  });

  it("missing storeName fails", () => {
    parseFail({
      branding: { productName: "P" },
      pages:    [{ type: "HOME", title: "Home", slug: "/" }],
      theme:    {},
    });
  });

  it("missing productName fails", () => {
    parseFail({
      branding: { storeName: "S" },
      pages:    [{ type: "HOME", title: "Home", slug: "/" }],
      theme:    {},
    });
  });

  it("null storeName fails — required structural field", () => {
    parseFail({
      branding: { storeName: null, productName: "P" },
      pages:    [{ type: "HOME", title: "Home", slug: "/" }],
      theme:    {},
    });
  });

  it("invalid section type fails", () => {
    parseFail(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id: "s1", type: "INVALID_SECTION_TYPE", position: 0, data: {},
        }],
      }],
    }));
  });

  it("removed ANNOUNCEMENT_BAR type fails — canonical type is ANNOUNCEMENT", () => {
    // ANNOUNCEMENT_BAR was removed in the contract simplification pass.
    // Only ANNOUNCEMENT is the valid ticker section type.
    parseFail(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{ id: "s1", type: "ANNOUNCEMENT_BAR", position: 0 }],
      }],
    }));
  });

  it("pages array with all invalid section types fails", () => {
    parseFail(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{ id: "s1", type: "FUTURE_SECTION", position: 0 }],
      }],
    }));
  });

  it("pages not being an array fails", () => {
    parseFail(minimalConfig({ pages: "not an array" }));
  });

  it("branding being null fails", () => {
    parseFail({
      branding: null,
      pages:    [{ type: "HOME", title: "Home", slug: "/" }],
      theme:    {},
    });
  });
});

// ── ANNOUNCEMENT section (canonical type) ────────────────────────────────────

describe("ANNOUNCEMENT section: canonical type and data", () => {
  it("parses a valid ANNOUNCEMENT section with items", () => {
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id: "ann-1",
          type: "ANNOUNCEMENT",
          position: 0,
          data: {
            items: [
              { text: "Darmowa wysyłka od 149 zł", icon: "🚀", emphasis: "ACCENT" },
              { text: "30-dniowy zwrot bez pytań", icon: "✅" },
            ],
            speed: 40,
            pauseOnHover: true,
          },

        }],
      }],
    }));
    const section = config.pages[0].sections[0];
    expect(section.type).toBe("ANNOUNCEMENT");
    expect(section.data?.["items"]).toHaveLength(2);
    expect((section.data?.["items"] as unknown[])[0]).toMatchObject({
      text: "Darmowa wysyłka od 149 zł",
      icon: "🚀",
      emphasis: "ACCENT",
    });
  });

  it("ANNOUNCEMENT section with null data is accepted", () => {
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id: "ann-1",
          type: "ANNOUNCEMENT",
          position: 0,
          data: null,

        }],
      }],
    }));
    expect(config.pages[0].sections[0].data).toBeNull();
  });

  it("ANNOUNCEMENT section with empty items array is accepted by schema", () => {
    // Schema accepts empty items — the Java validator enforces non-empty
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id: "ann-1",
          type: "ANNOUNCEMENT",
          position: 0,
          data: { items: [] },

        }],
      }],
    }));
    expect(config.pages[0].sections[0].type).toBe("ANNOUNCEMENT");
  });
});

// ── Hero v2 commerce fields ───────────────────────────────────────────────────

describe("hero: v2 commerce fields (socialProof, stickyBuyBar, trustItems)", () => {
  it("hero with v2 socialProof block is preserved in data", () => {
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id: "hero-1",
          type: "HERO",
          position: 0,
          data: {
            headline: "Śpisz źle od tygodni?",
            socialProof: {
              averageRating: 4.8,
              reviewCount: 1240,
              customerCountText: "Ponad 3 000 zadowolonych klientów",
              viewersNowText: "12 osób ogląda teraz",
            },
          },

        }],
      }],
    }));
    const data = config.pages[0].sections[0].data as Record<string, unknown>;
    expect(data?.["socialProof"]).toMatchObject({
      averageRating: 4.8,
      reviewCount: 1240,
    });
  });

  it("hero with stickyBuyBar config is preserved in data", () => {
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id: "hero-1",
          type: "HERO",
          position: 0,
          data: {
            headline: "SleepWell",
            stickyBuyBar: {
              enabled: true,
              label: "SleepWell",
              trustText: "30-dniowy zwrot",
              mobileOnly: false,
              showAfterHero: true,
            },
          },

        }],
      }],
    }));
    const data = config.pages[0].sections[0].data as Record<string, unknown>;
    expect(data?.["stickyBuyBar"]).toMatchObject({
      enabled: true,
      mobileOnly: false,
    });
  });

  it("hero with trustItems array is preserved in data", () => {
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id: "hero-1",
          type: "HERO",
          position: 0,
          data: {
            headline: "SleepWell",
            trustItems: [
              { icon: "🔒", text: "SSL" },
              { icon: "↩️", text: "30-dniowy zwrot" },
            ],
            paymentMethods: ["BLIK", "Przelewy24", "Apple Pay"],
          },

        }],
      }],
    }));
    const data = config.pages[0].sections[0].data as Record<string, unknown>;
    expect(data?.["trustItems"]).toHaveLength(2);
    expect(data?.["paymentMethods"]).toContain("BLIK");
  });

  it("hero with v2 packageOption fields (isDefault, stockHint) is preserved", () => {
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id: "hero-1",
          type: "HERO",
          position: 0,
          data: {
            headline: "SleepWell",
            packages: [
              {
                name: "Zestaw 3-miesięczny",
                quantity: 3,
                price: 149,
                compareAtPrice: 249,
                label: "BESTSELLER",
                isDefault: true,
                stockHint: "Ostatnie 12 sztuk",
                savingsText: "Oszczędzasz 100 zł",
                badge: "Najlepsza wartość",
              },
            ],
          },

        }],
      }],
    }));
    const data = config.pages[0].sections[0].data as Record<string, unknown>;
    const packages = data?.["packages"] as unknown[];
    expect(packages?.[0]).toMatchObject({
      isDefault: true,
      stockHint: "Ostatnie 12 sztuk",
      savingsText: "Oszczędzasz 100 zł",
    });
  });

  it("null stickyBuyBar is accepted in data", () => {
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id: "hero-1",
          type: "HERO",
          position: 0,
          data: { headline: "Title", stickyBuyBar: null },

        }],
      }],
    }));
    const data = config.pages[0].sections[0].data as Record<string, unknown>;
    expect(data?.["stickyBuyBar"]).toBeNull();
  });
});

// ── UGC rich items (v2) ───────────────────────────────────────────────────────

describe("UGC section: rich items (v2 format)", () => {
  it("parses UGC section with v2 items array", () => {
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id: "ugc-1",
          type: "UGC",
          position: 3,
          data: {
            title: "Co mówią nasi klienci",
            items: [
              {
                imageUrl: "https://example.com/user1.jpg",
                authorName: "Anna K.",
                caption: "Najlepsza decyzja!",
                rating: 5,
                location: "Warszawa",
                featured: true,
              },
              {
                videoUrl: "https://youtube.com/embed/abc",
                authorName: "Piotr M.",
                caption: "Polecam każdemu",
                rating: 5,
              },
              {
                imageUrl: "https://example.com/user3.jpg",
                authorName: "Marta W.",
                caption: "Super produkt",
                location: "Kraków",
              },
            ],
          },

        }],
      }],
    }));
    const data = config.pages[0].sections[0].data as Record<string, unknown>;
    expect(data?.["items"]).toHaveLength(3);
    expect((data?.["items"] as unknown[])[0]).toMatchObject({
      authorName: "Anna K.",
      featured: true,
      location: "Warszawa",
    });
  });

  it("UGC section without items[] (empty data) is accepted by schema", () => {
    // Schema accepts a UGC section with no items — the Java validator enforces minimum count.
    // The renderer skips items with no media URL or caption; an empty UGC renders nothing.
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id: "ugc-1",
          type: "UGC",
          position: 3,
          data: { title: "Co mówią klienci" },

        }],
      }],
    }));
    const data = config.pages[0].sections[0].data as Record<string, unknown>;
    expect(data?.["title"]).toBe("Co mówią klienci");
    expect(data?.["items"]).toBeUndefined();
  });

  it("UGC item with null optional fields is preserved", () => {
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id: "ugc-1",
          type: "UGC",
          position: 3,
          data: {
            items: [
              { imageUrl: "https://example.com/img.jpg", videoUrl: null, featured: null, rating: null },
            ],
          },

        }],
      }],
    }));
    const items = (config.pages[0].sections[0].data as Record<string, unknown>)?.["items"] as unknown[];
    expect((items[0] as Record<string, unknown>)["videoUrl"]).toBeNull();
    expect((items[0] as Record<string, unknown>)["featured"]).toBeNull();
  });
});

// ── Testimonial rich fields (v2) ──────────────────────────────────────────────

describe("testimonials: rich v2 fields", () => {
  it("parses TESTIMONIALS section with full v2 testimonial cards", () => {
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id: "ts-1",
          type: "TESTIMONIALS",
          position: 4,
          data: {
            title: "Opinie naszych klientów",
            testimonials: [
              {
                authorName: "Marek Z.",
                title: "Przestałem budzić się w nocy po 2 tygodniach",
                quoteShort: "Rewelacyjny efekt już po tygodniu",
                quoteLong: "Długi opis doświadczenia z produktem...",
                rating: 5,
                location: "Gdańsk",
                verifiedPurchase: true,
                featured: true,
                improvementTimeframe: "Po 2 tygodniach",
                productVariant: "Zestaw 3-miesięczny",
                imageUrl: "https://example.com/marek.jpg",
              },
            ],
          },

        }],
      }],
    }));
    const testimonials = (config.pages[0].sections[0].data as Record<string, unknown>)
      ?.["testimonials"] as unknown[];
    expect(testimonials).toHaveLength(1);
    expect(testimonials[0]).toMatchObject({
      authorName: "Marek Z.",
      title: "Przestałem budzić się w nocy po 2 tygodniach",
      verifiedPurchase: true,
      featured: true,
      improvementTimeframe: "Po 2 tygodniach",
      productVariant: "Zestaw 3-miesięczny",
    });
  });

  it("testimonial with quoteShort and quoteLong — both are preserved in data", () => {
    // Canonical v2 format: quoteShort for compact cards, quoteLong for expanded view.
    // The renderer prefers quoteShort and falls back to quoteLong.
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id: "ts-1",
          type: "TESTIMONIALS",
          position: 4,
          data: {
            testimonials: [
              {
                authorName: "Anna K.",
                quoteShort: "Najlepszy produkt na rynku",
                quoteLong: "Używam od 3 miesięcy i efekty są niesamowite. Polecam każdemu.",
                rating: 5,
              },
            ],
          },

        }],
      }],
    }));
    const t = ((config.pages[0].sections[0].data as Record<string, unknown>)
      ?.["testimonials"] as unknown[])[0] as Record<string, unknown>;
    expect(t["quoteShort"]).toBe("Najlepszy produkt na rynku");
    expect(t["quoteLong"]).toContain("3 miesięcy");
    expect(t["text"]).toBeUndefined();
  });

  it("null rich testimonial fields are preserved as-is in data", () => {
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id: "ts-1",
          type: "TESTIMONIALS",
          position: 4,
          data: {
            testimonials: [
              {
                authorName: "Jan K.",
                text: "Polecam!",
                rating: 5,
                verifiedPurchase: null,
                imageUrl: null,
                improvementTimeframe: null,
              },
            ],
          },

        }],
      }],
    }));
    const t = ((config.pages[0].sections[0].data as Record<string, unknown>)
      ?.["testimonials"] as unknown[])[0] as Record<string, unknown>;
    expect(t["verifiedPurchase"]).toBeNull();
    expect(t["imageUrl"]).toBeNull();
  });
});

// ── Backward compatibility: preserved data keys ──────────────────────────────
//
// The Zod schema stores section data as opaque Record<string, unknown>.
// Any key present in data is preserved unchanged — the schema does not
// validate data contents. This block tests schema-level passthrough only.
// The renderer is the layer that decides which keys to read.

describe("data passthrough: unknown keys are preserved unchanged", () => {
  it("hero with trustBadge/deliveryInfo/paymentInfo (legacy display hints) parses correctly", () => {
    // trustBadge/deliveryInfo/paymentInfo are still rendered by HeroSection.
    // They coexist alongside the canonical trustItems[] array.
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id: "hero-1",
          type: "HERO",
          position: 0,
          data: {
            headline: "Buy SleepWell",
            trustBadge: "Certyfikat GMP",
            deliveryInfo: "Wysyłka w 24h",
            paymentInfo: "BLIK, karta",
            packages: [{ name: "1 szt", quantity: 1, price: 89 }],
          },

        }],
      }],
    }));
    const data = config.pages[0].sections[0].data as Record<string, unknown>;
    expect(data?.["trustBadge"]).toBe("Certyfikat GMP");
    expect(data?.["trustItems"]).toBeUndefined();
    expect(data?.["stickyBuyBar"]).toBeUndefined();
  });

  it("schema treats data as opaque — arbitrary extra keys pass through", () => {
    // Section data is Record<string, unknown>: the schema never rejects
    // unknown keys inside data. Only the section type enum is validated.
    const config = parseOk(minimalConfig({
      pages: [{
        type: "HOME", title: "Home", slug: "/",
        sections: [{
          id: "hero-1",
          type: "HERO",
          position: 0,
          data: {
            headline: "Test",
            someObsoleteKey: "value",
            anotherKey: 42,
            nestedObject: { a: 1, b: [1, 2, 3] },
          },

        }],
      }],
    }));
    const data = config.pages[0].sections[0].data as Record<string, unknown>;
    expect(data?.["someObsoleteKey"]).toBe("value");
    expect(data?.["anotherKey"]).toBe(42);
    expect(data?.["nestedObject"]).toMatchObject({ a: 1 });
  });
});

// ── Canonical full config: all 16 section types ───────────────────────────────

describe("canonical full config: all section types parse without errors", () => {
  it("full canonical config with all 16 section types parses without errors", () => {
    // This is the canonical v2 section type set after the contract simplification.
    // ANNOUNCEMENT_BAR has been removed — the canonical ticker type is ANNOUNCEMENT.
    const config = parseOk({
      branding: { storeName: "SleepWell", productName: "SleepWell Pro" },
      theme: { primaryColor: "#0f172a" },
      commerce: {
        provider: "woocommerce",
        storeUrl: "https://sklep.pl",
        productUrl: "https://sklep.pl/product/sleepwell",
        productId: "42",
        checkoutMode: "ADD_TO_CART_REDIRECT",
        ctaButtonLabel: "Zamów teraz",
      },
      pages: [{
        type: "HOME",
        title: "Home",
        slug: "/",
        sections: [
          { id: "s1",  type: "ANNOUNCEMENT",   position: 0,  data: { items: [{ text: "Darmowa wysyłka!" }] } },
          { id: "s2",  type: "HERO",            position: 1,  data: { headline: "Śpisz źle?" } },
          { id: "s3",  type: "TRUST_BAR",       position: 2,  data: { items: ["Certyfikat GMP", "30-dniowy zwrot"] } },
          { id: "s4",  type: "BENEFITS",        position: 3,  data: { items: [{ title: "Lepszy sen", description: "..." }] } },
          { id: "s5",  type: "PROBLEM",         position: 4,  data: { items: [{ title: "Bezsenność", description: "..." }] } },
          { id: "s6",  type: "FEATURES",        position: 5,  data: { items: [{ name: "Melatonina", description: "..." }] } },
          { id: "s7",  type: "COMPARISON",      position: 6,  data: { rows: [{ feature: "Cena", productValue: "89 zł", competitorValue: "120 zł" }] } },
          { id: "s8",  type: "TESTIMONIALS",    position: 7,  data: { testimonials: [{ authorName: "Anna", quoteShort: "Super!", rating: 5 }] } },
          { id: "s9",  type: "UGC",             position: 8,  data: { items: [{ imageUrl: "https://example.com/img.jpg", caption: "Polecam!", authorName: "Kasia" }] } },
          { id: "s10", type: "EXPERT",          position: 9,  data: { expertName: "Dr. Kowalski", title: "Opinia eksperta" } },
          { id: "s11", type: "STORY",           position: 10, data: { title: "Nasza historia", paragraphs: [{ body: "Zaczęło się od..." }] } },
          { id: "s12", type: "RISK_REVERSAL",   position: 11, data: { title: "30-dniowa gwarancja", steps: ["Kup", "Przetestuj", "Zwróć"] } },
          { id: "s13", type: "OFFER",           position: 12, data: { title: "Oferta", price: 89, compareAtPrice: 149, included: ["Darmowa wysyłka"] } },
          { id: "s14", type: "FAQ",             position: 13, data: { items: [{ question: "Jak działa?", answer: "Poprzez..." }] } },
          { id: "s15", type: "CTA",             position: 14, data: { headline: "Zacznij dziś", trustItems: ["SSL", "30-dniowy zwrot"] } },
          { id: "s16", type: "FOOTER",          position: 15, data: { contactEmail: "info@sklep.pl", links: [{ label: "Polityka", href: "/polityka" }] } },
        ],
      }],
    });
    expect(config.pages[0].sections).toHaveLength(16);
    const types = config.pages[0].sections.map((s) => s.type);
    expect(types).toContain("ANNOUNCEMENT");
    expect(types).not.toContain("ANNOUNCEMENT_BAR");
    expect(types).toContain("UGC");
    expect(types).toContain("EXPERT");
    expect(types).toContain("STORY");
    expect(types).toContain("RISK_REVERSAL");
  });
});

// ── Integration: canonical runtime payload → parse → shape check ──────────────
//
// This fixture represents the exact JSON shape that StorefrontAiService.java
// generates for a SleepWell-style product storefront. It verifies that the
// canonical backend runtime payload parses cleanly through the storefront schema
// with no shape mismatches — the contract boundary between backend and renderer.

describe("integration: canonical backend payload → storefront schema → no shape mismatch", () => {
  it("canonical runtime payload from AI service parses and all key fields are reachable", () => {
    const canonical = {
      branding: {
        storeName: "SleepWell",
        productName: "SleepWell Pro",
        tagline: "Śpij lepiej od pierwszej nocy",
        language: "pl",
        logoUrl: "https://api.example.com/api/storefront/media/logo.png",
        faviconUrl: "https://api.example.com/api/storefront/media/favicon.ico",
      },
      theme: {
        primaryColor: "#0f172a",
        backgroundColor: "#ffffff",
        accentColor: "#6366f1",
        fontPreset: "modern",
        radius: "xl",
        spacing: "comfortable",
        shadow: "soft",
      },
      commerce: {
        provider: "woocommerce",
        storeUrl: "https://sklep.example.com",
        productUrl: "https://sklep.example.com/product/sleepwell-pro",
        productId: "42",
        checkoutMode: "ADD_TO_CART_REDIRECT",
        ctaButtonLabel: "Zamów teraz",
      },
      seo: {
        title: "SleepWell Pro — Zasypiaj szybciej",
        description: "Suplement diety wspierający zdrowy sen.",
        ogTitle: "SleepWell Pro",
        ogImage: "https://api.example.com/api/storefront/media/og.jpg",
        noIndex: false,
      },
      analytics: { provider: "custom", enabled: true },
      pages: [{
        type: "HOME",
        title: "Strona główna",
        slug: "/",
        sections: [
          {
            id: "ann-1",
            type: "ANNOUNCEMENT",
            position: 0,
            data: {
              items: [
                { text: "Darmowa wysyłka od 149 zł", icon: "🚀", emphasis: "ACCENT" },
                { text: "30-dniowy zwrot bez pytań",  icon: "✅" },
              ],
              speed: 40,
              pauseOnHover: true,
            },
  
          },
          {
            id: "hero-1",
            type: "HERO",
            position: 1,
            data: {
              headline: "Śpisz źle od tygodni?",
              subheadline: "SleepWell Pro — suplement wspierający zdrowy sen",
              description: "Naturalna formuła z melatoniną, magnezem i ashwagandą.",
              bullets: ["Zasypiasz w 20 minut", "Budzisz się wypoczęty", "Bez uzależnienia"],
              socialProof: {
                averageRating: 4.8,
                reviewCount: 1240,
                customerCountText: "Ponad 3 000 zadowolonych klientów",
                viewersNowText: "12 osób ogląda teraz",
                purchasedRecentlyText: "28 osób kupiło w ostatnich 24h",
              },
              gallery: [
                "https://api.example.com/api/storefront/media/product-1.jpg",
                "https://api.example.com/api/storefront/media/product-2.jpg",
              ],
              packages: [
                {
                  name: "1 sztuka — Starter",
                  quantity: 1,
                  price: 89,
                  compareAtPrice: 119,
                  savingsText: "Oszczędzasz 30 zł",
                  badge: "Starter",
                  ctaHref: "https://sklep.example.com/koszyk?add-to-cart=42&qty=1",
                },
                {
                  name: "Zestaw 3-miesięczny",
                  quantity: 3,
                  price: 229,
                  compareAtPrice: 357,
                  savingsText: "Oszczędzasz 128 zł",
                  badge: "Bestseller",
                  label: "BESTSELLER",
                  isDefault: true,
                  stockHint: "Ostatnie 14 sztuk",
                  ctaHref: "https://sklep.example.com/koszyk?add-to-cart=42&qty=3",
                },
              ],
              primaryCtaLabel: "Zamów teraz",
              trustBadge: "Certyfikat GMP",
              deliveryInfo: "Wysyłka w 24h",
              paymentInfo: "BLIK, Przelewy24, Apple Pay",
              trustItems: [
                { icon: "🔒", text: "Bezpieczna płatność" },
                { icon: "↩️", text: "30-dniowy zwrot" },
              ],
              stickyBuyBar: {
                enabled: true,
                label: "SleepWell Pro",
                defaultPriceText: "od 89 zł",
                trustText: "30-dniowy zwrot bez pytań",
                mobileOnly: false,
                showAfterHero: true,
                ctaLabelOverride: "Zamów teraz",
              },
            },
  
          },
          {
            id: "ugc-1",
            type: "UGC",
            position: 2,
            data: {
              title: "Co mówią nasi klienci",
              items: [
                {
                  imageUrl: "https://api.example.com/api/storefront/media/ugc-1.jpg",
                  authorName: "Anna K.",
                  caption: "Najlepsza decyzja! Śpię jak dziecko.",
                  rating: 5,
                  location: "Warszawa",
                  featured: true,
                },
                {
                  videoUrl: "https://youtube.com/embed/abc123",
                  authorName: "Piotr M.",
                  caption: "Polecam każdemu kto ma problem z zasypianiem.",
                  rating: 5,
                },
                {
                  imageUrl: "https://api.example.com/api/storefront/media/ugc-3.jpg",
                  authorName: "Marta W.",
                  caption: "Super produkt, widzę efekty po tygodniu.",
                  location: "Kraków",
                },
              ],
            },
  
          },
          {
            id: "ts-1",
            type: "TESTIMONIALS",
            position: 3,
            data: {
              title: "Opinie naszych klientów",
              testimonials: [
                {
                  authorName: "Marek Z.",
                  title: "Przestałem budzić się w nocy",
                  quoteShort: "Rewelacyjny efekt już po tygodniu",
                  quoteLong: "Używam od 3 miesięcy. Śpię głębiej, budzę się wypoczęty.",
                  rating: 5,
                  location: "Gdańsk",
                  verifiedPurchase: true,
                  featured: true,
                  improvementTimeframe: "Po 2 tygodniach",
                  productVariant: "Zestaw 3-miesięczny",
                  imageUrl: "https://api.example.com/api/storefront/media/marek.jpg",
                },
              ],
            },
  
          },
        ],
      }],
    };

    const config = parseOk(canonical);

    // Top-level config fields
    expect(config.branding.storeName).toBe("SleepWell");
    expect(config.branding.language).toBe("pl");
    expect(config.commerce?.provider).toBe("woocommerce");
    expect(config.commerce?.ctaButtonLabel).toBe("Zamów teraz");
    expect(config.seo?.title).toBe("SleepWell Pro — Zasypiaj szybciej");
    expect(config.analytics.enabled).toBe(true);

    const sections = config.pages[0].sections;
    expect(sections).toHaveLength(4);

    // ANNOUNCEMENT section
    const ann = sections[0];
    expect(ann.type).toBe("ANNOUNCEMENT");
    expect((ann.data?.["items"] as unknown[]).length).toBe(2);

    // HERO section — socialProof, packages, stickyBuyBar
    const hero = sections[1];
    expect(hero.type).toBe("HERO");
    const hs = hero.data as Record<string, unknown>;
    expect((hs["socialProof"] as Record<string, unknown>)["averageRating"]).toBe(4.8);
    expect((hs["socialProof"] as Record<string, unknown>)["reviewCount"]).toBe(1240);
    expect((hs["gallery"] as string[])).toHaveLength(2);
    expect((hs["packages"] as unknown[])).toHaveLength(2);
    const bestsellerPkg = (hs["packages"] as Record<string, unknown>[])[1];
    expect(bestsellerPkg["isDefault"]).toBe(true);
    expect(bestsellerPkg["stockHint"]).toBe("Ostatnie 14 sztuk");
    expect((hs["stickyBuyBar"] as Record<string, unknown>)["enabled"]).toBe(true);
    expect((hs["trustItems"] as unknown[])).toHaveLength(2);

    // UGC section — rich items[]
    const ugc = sections[2];
    expect(ugc.type).toBe("UGC");
    const ugcItems = ugc.data?.["items"] as unknown[];
    expect(ugcItems).toHaveLength(3);
    expect((ugcItems[0] as Record<string, unknown>)["featured"]).toBe(true);
    expect((ugcItems[1] as Record<string, unknown>)["videoUrl"]).toBe("https://youtube.com/embed/abc123");

    // TESTIMONIALS section — quoteShort/quoteLong/rich fields
    const ts = sections[3];
    expect(ts.type).toBe("TESTIMONIALS");
    const testimonials = ts.data?.["testimonials"] as Record<string, unknown>[];
    expect(testimonials).toHaveLength(1);
    expect(testimonials[0]["quoteShort"]).toBe("Rewelacyjny efekt już po tygodniu");
    expect(testimonials[0]["improvementTimeframe"]).toBe("Po 2 tygodniach");
    expect(testimonials[0]["verifiedPurchase"]).toBe(true);
    expect(testimonials[0]["text"]).toBeUndefined(); // canonical uses quoteShort/quoteLong
  });
});
