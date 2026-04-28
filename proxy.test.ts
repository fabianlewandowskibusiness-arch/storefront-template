import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy as middleware } from "./proxy";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(
  url: string,
  extraHeaders: Record<string, string> = {},
): NextRequest {
  const req = new NextRequest(url, { headers: extraHeaders });
  return req;
}

function getResponseHeader(response: ReturnType<typeof middleware>, name: string): string | null {
  // NextResponse.next({ request: { headers } }) stores the mutated request
  // headers in the x-middleware-request-* convention used by Next.js internally.
  // The simplest way to test the output is to inspect the `headers` property
  // on the response object.
  return response.headers.get(`x-middleware-request-${name}`);
}

// ── x-storefront-host ─────────────────────────────────────────────────────────

describe("x-storefront-host forwarding", () => {
  it("sets x-storefront-host from the Host header", () => {
    const req = makeRequest("https://store-a.ecommerce-flow.ai/", {
      host: "store-a.ecommerce-flow.ai",
    });
    const res = middleware(req);
    expect(getResponseHeader(res, "x-storefront-host")).toBe("store-a.ecommerce-flow.ai");
  });

  it("prefers x-forwarded-host over Host (Vercel reverse-proxy scenario)", () => {
    const req = makeRequest("https://store-a.ecommerce-flow.ai/", {
      host: "store-a.ecommerce-flow.ai",
      "x-forwarded-host": "customerbrand.pl",
    });
    const res = middleware(req);
    expect(getResponseHeader(res, "x-storefront-host")).toBe("customerbrand.pl");
  });

  it("falls back to request hostname when no Host header is present", () => {
    // NextRequest always has a URL, so nextUrl.hostname is always available
    const req = makeRequest("https://fallback-host.example.com/page");
    const res = middleware(req);
    const host = getResponseHeader(res, "x-storefront-host");
    // Should be non-empty
    expect(host).toBeTruthy();
  });

  it("two requests for different hosts produce different x-storefront-host values", () => {
    const resA = middleware(makeRequest("https://storeA.ecommerce-flow.ai/", { host: "storeA.ecommerce-flow.ai" }));
    const resB = middleware(makeRequest("https://storeB.ecommerce-flow.ai/", { host: "storeB.ecommerce-flow.ai" }));
    const hostA = getResponseHeader(resA, "x-storefront-host");
    const hostB = getResponseHeader(resB, "x-storefront-host");
    expect(hostA).not.toBe(hostB);
  });
});

// ── x-storefront-mode (draft) ─────────────────────────────────────────────────

describe("x-storefront-mode draft forwarding", () => {
  it("sets x-storefront-mode: draft when ?mode=draft is present", () => {
    const req = makeRequest("https://store.ecommerce-flow.ai/?mode=draft", {
      host: "store.ecommerce-flow.ai",
    });
    const res = middleware(req);
    expect(getResponseHeader(res, "x-storefront-mode")).toBe("draft");
  });

  it("does not set x-storefront-mode for normal requests", () => {
    const req = makeRequest("https://store.ecommerce-flow.ai/", {
      host: "store.ecommerce-flow.ai",
    });
    const res = middleware(req);
    expect(getResponseHeader(res, "x-storefront-mode")).toBeNull();
  });

  it("does not set x-storefront-mode for unrelated query params", () => {
    const req = makeRequest("https://store.ecommerce-flow.ai/?utm_source=google", {
      host: "store.ecommerce-flow.ai",
    });
    const res = middleware(req);
    expect(getResponseHeader(res, "x-storefront-mode")).toBeNull();
  });

  it("sets both x-storefront-host AND x-storefront-mode for draft requests", () => {
    const req = makeRequest("https://store.ecommerce-flow.ai/?mode=draft", {
      host: "store.ecommerce-flow.ai",
    });
    const res = middleware(req);
    expect(getResponseHeader(res, "x-storefront-host")).toBe("store.ecommerce-flow.ai");
    expect(getResponseHeader(res, "x-storefront-mode")).toBe("draft");
  });
});
