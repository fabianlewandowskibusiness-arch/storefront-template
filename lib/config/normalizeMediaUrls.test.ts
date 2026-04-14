import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  rewriteMediaUrl,
  walkAndRewrite,
  normalizeMediaUrls,
  getPublicMediaOrigin,
} from "./normalizeMediaUrls";

const PUBLIC_ORIGIN = "https://orogenic-anton-subrectangular.ngrok-free.dev";

describe("rewriteMediaUrl", () => {
  describe("absolute localhost URLs (the bug we are mitigating)", () => {
    it("rewrites http://localhost:8080/api/storage/local/... to public origin", () => {
      const input = "http://localhost:8080/api/storage/local/storefront-media/abc.jpg";
      const expected = `${PUBLIC_ORIGIN}/api/storage/local/storefront-media/abc.jpg`;
      expect(rewriteMediaUrl(input, PUBLIC_ORIGIN)).toBe(expected);
    });

    it("rewrites https://localhost/api/storage/... (no port)", () => {
      const input = "https://localhost/api/storage/local/foo.png";
      expect(rewriteMediaUrl(input, PUBLIC_ORIGIN)).toBe(
        `${PUBLIC_ORIGIN}/api/storage/local/foo.png`,
      );
    });

    it("rewrites http://127.0.0.1:8080/api/storage/...", () => {
      const input = "http://127.0.0.1:8080/api/storage/local/avatar.svg";
      expect(rewriteMediaUrl(input, PUBLIC_ORIGIN)).toBe(
        `${PUBLIC_ORIGIN}/api/storage/local/avatar.svg`,
      );
    });

    it("preserves query string and hash", () => {
      const input = "http://localhost:8080/api/storage/local/img.jpg?v=2&x=1#frag";
      expect(rewriteMediaUrl(input, PUBLIC_ORIGIN)).toBe(
        `${PUBLIC_ORIGIN}/api/storage/local/img.jpg?v=2&x=1#frag`,
      );
    });

    it("rewrites /api/storefront/media/{id} hosted on localhost", () => {
      const input = "http://localhost:8080/api/storefront/media/abc-123";
      expect(rewriteMediaUrl(input, PUBLIC_ORIGIN)).toBe(
        `${PUBLIC_ORIGIN}/api/storefront/media/abc-123`,
      );
    });

    it("rewrites /storefront-media/... legacy path on localhost", () => {
      const input = "http://localhost:8080/storefront-media/legacy.png";
      expect(rewriteMediaUrl(input, PUBLIC_ORIGIN)).toBe(
        `${PUBLIC_ORIGIN}/storefront-media/legacy.png`,
      );
    });
  });

  describe("relative media paths", () => {
    it("resolves /api/storage/local/... against the public origin", () => {
      const input = "/api/storage/local/storefront-media/x.jpg";
      expect(rewriteMediaUrl(input, PUBLIC_ORIGIN)).toBe(
        `${PUBLIC_ORIGIN}/api/storage/local/storefront-media/x.jpg`,
      );
    });

    it("resolves /api/storefront/media/abc against the public origin", () => {
      const input = "/api/storefront/media/abc-123";
      expect(rewriteMediaUrl(input, PUBLIC_ORIGIN)).toBe(
        `${PUBLIC_ORIGIN}/api/storefront/media/abc-123`,
      );
    });
  });

  describe("URLs that must NOT be rewritten", () => {
    it("leaves an already-correct public URL unchanged", () => {
      const input = `${PUBLIC_ORIGIN}/api/storage/local/img.jpg`;
      expect(rewriteMediaUrl(input, PUBLIC_ORIGIN)).toBe(input);
    });

    it("leaves a non-localhost public URL unchanged", () => {
      const input = "https://cdn.example.com/api/storage/local/img.jpg";
      expect(rewriteMediaUrl(input, PUBLIC_ORIGIN)).toBe(input);
    });

    it("leaves a localhost URL with a NON-media path unchanged", () => {
      // Critical: must not rewrite unrelated localhost values.
      const input = "http://localhost:8080/admin/dashboard";
      expect(rewriteMediaUrl(input, PUBLIC_ORIGIN)).toBe(input);
    });

    it("leaves a relative path that is not a media path unchanged", () => {
      const input = "/products/123";
      expect(rewriteMediaUrl(input, PUBLIC_ORIGIN)).toBe(input);
    });

    it("leaves a plain string unchanged", () => {
      expect(rewriteMediaUrl("Kup teraz", PUBLIC_ORIGIN)).toBe("Kup teraz");
    });

    it("leaves an empty string unchanged", () => {
      expect(rewriteMediaUrl("", PUBLIC_ORIGIN)).toBe("");
    });

    it("leaves an anchor link unchanged", () => {
      expect(rewriteMediaUrl("#offer", PUBLIC_ORIGIN)).toBe("#offer");
    });

    it("leaves a mailto link unchanged", () => {
      expect(rewriteMediaUrl("mailto:hi@example.com", PUBLIC_ORIGIN)).toBe(
        "mailto:hi@example.com",
      );
    });

    it("returns malformed http URLs unchanged", () => {
      const input = "http://[not a url";
      expect(rewriteMediaUrl(input, PUBLIC_ORIGIN)).toBe(input);
    });
  });
});

describe("walkAndRewrite", () => {
  it("rewrites strings deep inside nested objects and arrays", () => {
    const input = {
      branding: { logoUrl: "http://localhost:8080/api/storage/local/logo.png" },
      pages: [
        {
          sections: [
            {
              type: "HERO",
              data: { image: "http://localhost:8080/api/storage/local/hero.jpg" },
            },
          ],
        },
      ],
    };

    const result = walkAndRewrite(input, PUBLIC_ORIGIN);
    expect(result.branding.logoUrl).toBe(`${PUBLIC_ORIGIN}/api/storage/local/logo.png`);
    expect(result.pages[0].sections[0].data.image).toBe(
      `${PUBLIC_ORIGIN}/api/storage/local/hero.jpg`,
    );
  });

  it("does not mutate the original input", () => {
    const original = {
      logo: "http://localhost:8080/api/storage/local/logo.png",
    };
    const snapshot = JSON.parse(JSON.stringify(original));
    walkAndRewrite(original, PUBLIC_ORIGIN);
    expect(original).toEqual(snapshot);
  });

  it("preserves null, numbers, booleans, and undefined as-is", () => {
    const input = {
      a: null,
      b: 42,
      c: true,
      d: undefined,
      e: ["http://localhost:8080/api/storage/local/x.jpg", null, 0],
    };
    const result = walkAndRewrite(input, PUBLIC_ORIGIN);
    expect(result.a).toBeNull();
    expect(result.b).toBe(42);
    expect(result.c).toBe(true);
    expect(result.d).toBeUndefined();
    expect(result.e[0]).toBe(`${PUBLIC_ORIGIN}/api/storage/local/x.jpg`);
    expect(result.e[1]).toBeNull();
    expect(result.e[2]).toBe(0);
  });
});

describe("normalizeMediaUrls (env-aware entry point)", () => {
  const ORIGINAL_ENV = process.env.STOREFRONT_API_URL;

  beforeEach(() => {
    delete process.env.STOREFRONT_API_URL;
  });

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.STOREFRONT_API_URL;
    } else {
      process.env.STOREFRONT_API_URL = ORIGINAL_ENV;
    }
  });

  it("is a no-op when STOREFRONT_API_URL is unset (local-only dev)", () => {
    const input = { logo: "http://localhost:8080/api/storage/local/x.jpg" };
    expect(normalizeMediaUrls(input)).toEqual(input);
  });

  it("rewrites media URLs when STOREFRONT_API_URL is set", () => {
    process.env.STOREFRONT_API_URL = `${PUBLIC_ORIGIN}/api`;
    const input = { logo: "http://localhost:8080/api/storage/local/x.jpg" };
    const result = normalizeMediaUrls(input);
    expect(result.logo).toBe(`${PUBLIC_ORIGIN}/api/storage/local/x.jpg`);
  });

  it("uses only the origin from STOREFRONT_API_URL (drops the /api suffix)", () => {
    process.env.STOREFRONT_API_URL = `${PUBLIC_ORIGIN}/api`;
    expect(getPublicMediaOrigin()).toBe(PUBLIC_ORIGIN);
  });

  it("returns null origin for an unparseable STOREFRONT_API_URL", () => {
    process.env.STOREFRONT_API_URL = "not a url";
    expect(getPublicMediaOrigin()).toBeNull();
  });
});
