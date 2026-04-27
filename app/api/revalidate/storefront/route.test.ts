import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// vi.mock is hoisted — the mock is in place before any imports below resolve.
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

import { revalidateTag } from "next/cache";
import { POST } from "./route";
import { storefrontConfigTag, storefrontHostConfigTag } from "@/lib/cache/storefrontCacheTags";

// ── Helpers ───────────────────────────────────────────────────────────────────

const SECRET = "test-secret-token";
const STORE_ID = "abc123";

function makeRequest(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost/api/revalidate/storefront", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function bearerHeader(token = SECRET) {
  return { Authorization: `Bearer ${token}` };
}

function secretHeader(token = SECRET) {
  return { "x-revalidation-secret": token };
}

async function json(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

// ── Environment management ────────────────────────────────────────────────────

const ORIGINAL_SECRET = process.env.STOREFRONT_REVALIDATION_SECRET;

beforeEach(() => {
  process.env.STOREFRONT_REVALIDATION_SECRET = SECRET;
  vi.clearAllMocks();
});

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) {
    delete process.env.STOREFRONT_REVALIDATION_SECRET;
  } else {
    process.env.STOREFRONT_REVALIDATION_SECRET = ORIGINAL_SECRET;
  }
});

// ── Secret not configured ─────────────────────────────────────────────────────

describe("when STOREFRONT_REVALIDATION_SECRET is not set", () => {
  it("returns 500", async () => {
    delete process.env.STOREFRONT_REVALIDATION_SECRET;
    const res = await POST(makeRequest({ storeId: STORE_ID }, bearerHeader()));
    expect(res.status).toBe(500);
  });

  it("does not expose the secret in the error response", async () => {
    delete process.env.STOREFRONT_REVALIDATION_SECRET;
    const res = await POST(makeRequest({ storeId: STORE_ID }, bearerHeader()));
    const body = await json(res);
    expect(JSON.stringify(body)).not.toContain(SECRET);
  });

  it("does not call revalidateTag", async () => {
    delete process.env.STOREFRONT_REVALIDATION_SECRET;
    await POST(makeRequest({ storeId: STORE_ID }, bearerHeader()));
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

// ── Authentication ─────────────────────────────────────────────────────────────

describe("authentication", () => {
  it("accepts Authorization: Bearer token", async () => {
    const res = await POST(makeRequest({ storeId: STORE_ID }, bearerHeader()));
    expect(res.status).toBe(200);
  });

  it("accepts x-revalidation-secret header", async () => {
    const res = await POST(makeRequest({ storeId: STORE_ID }, secretHeader()));
    expect(res.status).toBe(200);
  });

  it("returns 401 when no auth header is provided", async () => {
    const res = await POST(makeRequest({ storeId: STORE_ID }));
    expect(res.status).toBe(401);
  });

  it("returns 401 when Authorization: Bearer has wrong token", async () => {
    const res = await POST(makeRequest({ storeId: STORE_ID }, bearerHeader("wrong-token")));
    expect(res.status).toBe(401);
  });

  it("returns 401 when x-revalidation-secret has wrong token", async () => {
    const res = await POST(makeRequest({ storeId: STORE_ID }, secretHeader("wrong-token")));
    expect(res.status).toBe(401);
  });

  it("returns 401 when Authorization header is Bearer with empty token", async () => {
    const res = await POST(makeRequest({ storeId: STORE_ID }, { Authorization: "Bearer " }));
    expect(res.status).toBe(401);
  });

  it("does not expose the configured secret in 401 response body", async () => {
    const res = await POST(makeRequest({ storeId: STORE_ID }, bearerHeader("bad")));
    const body = await json(res);
    expect(JSON.stringify(body)).not.toContain(SECRET);
  });
});

// ── Request body validation ───────────────────────────────────────────────────

describe("request body validation", () => {
  it("returns 400 when storeId is missing", async () => {
    const res = await POST(makeRequest({}, bearerHeader()));
    expect(res.status).toBe(400);
  });

  it("returns 400 when storeId is an empty string", async () => {
    const res = await POST(makeRequest({ storeId: "" }, bearerHeader()));
    expect(res.status).toBe(400);
  });

  it("returns 400 when storeId is whitespace only", async () => {
    const res = await POST(makeRequest({ storeId: "   " }, bearerHeader()));
    expect(res.status).toBe(400);
  });

  it("returns 400 when storeId is a number", async () => {
    const res = await POST(makeRequest({ storeId: 42 }, bearerHeader()));
    expect(res.status).toBe(400);
  });

  it("returns 400 when storeId is null", async () => {
    const res = await POST(makeRequest({ storeId: null }, bearerHeader()));
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-object body (array)", async () => {
    const req = new Request("http://localhost/api/revalidate/storefront", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...bearerHeader() },
      body: JSON.stringify([STORE_ID]),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for malformed JSON body", async () => {
    const req = new Request("http://localhost/api/revalidate/storefront", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...bearerHeader() },
      body: "not json {",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ── Successful revalidation (storeId only) ─────────────────────────────────────

describe("successful revalidation — storeId only", () => {
  it("returns 200", async () => {
    const res = await POST(makeRequest({ storeId: STORE_ID }, bearerHeader()));
    expect(res.status).toBe(200);
  });

  it("calls revalidateTag with { expire: 0 } for immediate expiration", async () => {
    await POST(makeRequest({ storeId: STORE_ID }, bearerHeader()));
    expect(revalidateTag).toHaveBeenCalledWith(
      storefrontConfigTag(STORE_ID),
      { expire: 0 },
    );
  });

  it("returns revalidated: true in response body", async () => {
    const res = await POST(makeRequest({ storeId: STORE_ID }, bearerHeader()));
    const body = await json(res);
    expect(body.revalidated).toBe(true);
  });

  it("returns the correct tag in response body", async () => {
    const res = await POST(makeRequest({ storeId: STORE_ID }, bearerHeader()));
    const body = await json(res);
    expect(body.tag).toBe(storefrontConfigTag(STORE_ID));
  });

  it("returns the normalised storeId in response body", async () => {
    const res = await POST(makeRequest({ storeId: "  abc123  " }, bearerHeader()));
    const body = await json(res);
    expect(body.storeId).toBe("abc123");
  });

  it("does NOT include a tags array when only storeId is provided", async () => {
    const res = await POST(makeRequest({ storeId: STORE_ID }, bearerHeader()));
    const body = await json(res);
    expect(body.tags).toBeUndefined();
  });

  it("calls revalidateTag exactly once when no host is given", async () => {
    await POST(makeRequest({ storeId: STORE_ID }, bearerHeader()));
    expect(revalidateTag).toHaveBeenCalledTimes(1);
  });

  it("uses x-revalidation-secret header auth equally well", async () => {
    const res = await POST(makeRequest({ storeId: STORE_ID }, secretHeader()));
    const body = await json(res);
    expect(body.revalidated).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith(storefrontConfigTag(STORE_ID), { expire: 0 });
  });
});

// ── Successful revalidation (storeId + host) ──────────────────────────────────

describe("successful revalidation — storeId + host (Phase 2 mode)", () => {
  const HOST = "brand.pl";

  it("returns 200", async () => {
    const res = await POST(makeRequest({ storeId: STORE_ID, host: HOST }, bearerHeader()));
    expect(res.status).toBe(200);
  });

  it("calls revalidateTag twice — once per tag", async () => {
    await POST(makeRequest({ storeId: STORE_ID, host: HOST }, bearerHeader()));
    expect(revalidateTag).toHaveBeenCalledTimes(2);
  });

  it("revalidates the config tag with { expire: 0 }", async () => {
    await POST(makeRequest({ storeId: STORE_ID, host: HOST }, bearerHeader()));
    expect(revalidateTag).toHaveBeenCalledWith(
      storefrontConfigTag(STORE_ID),
      { expire: 0 },
    );
  });

  it("revalidates the host tag with { expire: 0 }", async () => {
    await POST(makeRequest({ storeId: STORE_ID, host: HOST }, bearerHeader()));
    expect(revalidateTag).toHaveBeenCalledWith(
      storefrontHostConfigTag(HOST),
      { expire: 0 },
    );
  });

  it("includes a tags array with both tags in the response", async () => {
    const res = await POST(makeRequest({ storeId: STORE_ID, host: HOST }, bearerHeader()));
    const body = await json(res);
    expect(Array.isArray(body.tags)).toBe(true);
    const tags = body.tags as string[];
    expect(tags).toContain(storefrontConfigTag(STORE_ID));
    expect(tags).toContain(storefrontHostConfigTag(HOST));
  });

  it("ignores host when it is an empty string", async () => {
    const res = await POST(makeRequest({ storeId: STORE_ID, host: "" }, bearerHeader()));
    const body = await json(res);
    expect(revalidateTag).toHaveBeenCalledTimes(1);
    expect(body.tags).toBeUndefined();
  });

  it("ignores host when it is whitespace only", async () => {
    const res = await POST(makeRequest({ storeId: STORE_ID, host: "  " }, bearerHeader()));
    expect(revalidateTag).toHaveBeenCalledTimes(1);
    const body = await json(res);
    expect(body.tags).toBeUndefined();
  });

  it("ignores host when it is a non-string type", async () => {
    const res = await POST(makeRequest({ storeId: STORE_ID, host: 42 }, bearerHeader()));
    expect(revalidateTag).toHaveBeenCalledTimes(1);
    const body = await json(res);
    expect(body.tags).toBeUndefined();
  });
});

// ── Tag correctness ───────────────────────────────────────────────────────────

describe("tag correctness — ensure no cross-tenant invalidation", () => {
  it("revalidating store-a does not call revalidateTag for store-b's tag", async () => {
    await POST(makeRequest({ storeId: "store-a" }, bearerHeader()));
    const calls = vi.mocked(revalidateTag).mock.calls.map(([tag]) => tag);
    expect(calls).not.toContain(storefrontConfigTag("store-b"));
    expect(calls).toContain(storefrontConfigTag("store-a"));
  });

  it("tag passed to revalidateTag matches storefrontConfigTag(storeId)", async () => {
    await POST(makeRequest({ storeId: STORE_ID }, bearerHeader()));
    const [tag] = vi.mocked(revalidateTag).mock.calls[0];
    expect(tag).toBe(storefrontConfigTag(STORE_ID));
  });
});
