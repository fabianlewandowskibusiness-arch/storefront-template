import { describe, it, expect } from "vitest";
import { deriveExpertAnnouncementCta, type SectionLike } from "../expertCta";

// ── Test helpers ─────────────────────────────────────────────────────────────

function expert(data: Record<string, unknown>): SectionLike[] {
  return [{ type: "EXPERT", data }];
}

function expertWithRole(role: string): SectionLike[] {
  return expert({ expertRole: role });
}

function expertWithTitle(title: string): SectionLike[] {
  return expert({ title });
}

function expertWithBoth(role: string, title: string): SectionLike[] {
  return expert({ expertRole: role, title });
}

// ── Priority 0: explicit expertCtaText override ───────────────────────────────

describe("expertCtaText — explicit override (priority 0)", () => {
  it("returns bare text prefixed with 👉", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ expertCtaText: "Zobacz opinię fizjoterapeutki" }),
      ),
    ).toBe("👉 Zobacz opinię fizjoterapeutki");
  });

  it("normalises input that already starts with 👉", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ expertCtaText: "👉 Zobacz opinię pediatry" }),
      ),
    ).toBe("👉 Zobacz opinię pediatry");
  });

  it("trims leading/trailing whitespace before normalising", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ expertCtaText: "  Zobacz opinię dietetyka  " }),
      ),
    ).toBe("👉 Zobacz opinię dietetyka");
  });

  it("takes priority over a valid expertRole", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ expertCtaText: "Opinia eksperta", expertRole: "Pediatra" }),
      ),
    ).toBe("👉 Opinia eksperta");
  });

  it("takes priority over a valid title pattern", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ expertCtaText: "Rekomendacja specjalisty", title: "Opinia pediatry" }),
      ),
    ).toBe("👉 Rekomendacja specjalisty");
  });

  it("falls through to heuristic when expertCtaText is empty string", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ expertCtaText: "", expertRole: "Pediatra" }),
      ),
    ).toBe("👉 Zobacz opinię pediatry");
  });

  it("falls through to heuristic when expertCtaText is whitespace only", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ expertCtaText: "   ", expertRole: "Fizjoterapeuta" }),
      ),
    ).toBe("👉 Zobacz opinię fizjoterapeuty");
  });

  it("falls through to heuristic when expertCtaText is null", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ expertCtaText: null, expertRole: "Neurolog" }),
      ),
    ).toBe("👉 Zobacz opinię neurologa");
  });

  it("falls through to generic fallback when expertCtaText absent and no parseable data", () => {
    expect(
      deriveExpertAnnouncementCta(expert({ expertName: "Dr Jan" })),
    ).toBe("👉 Zobacz opinię eksperta");
  });
});

// ── No Expert section ─────────────────────────────────────────────────────────

describe("no Expert section", () => {
  it("returns null when sections array is empty", () => {
    expect(deriveExpertAnnouncementCta([])).toBeNull();
  });

  it("returns null when only non-expert sections are present", () => {
    const sections: SectionLike[] = [
      { type: "HERO", data: { gallery: [] } },
      { type: "BENEFITS", data: { title: "Zalety" } },
    ];
    expect(deriveExpertAnnouncementCta(sections)).toBeNull();
  });
});

// ── Expert section with no parseable data ─────────────────────────────────────

describe("Expert section — safe fallback", () => {
  it("returns generic fallback when data is null", () => {
    const sections: SectionLike[] = [{ type: "EXPERT", data: null }];
    expect(deriveExpertAnnouncementCta(sections)).toBe(
      "👉 Zobacz opinię eksperta",
    );
  });

  it("returns generic fallback when both role and title are empty strings", () => {
    expect(deriveExpertAnnouncementCta(expert({ expertRole: "", title: "" }))).toBe(
      "👉 Zobacz opinię eksperta",
    );
  });

  it("returns generic fallback when role and title are unknown/unrecognised phrases", () => {
    expect(
      deriveExpertAnnouncementCta(
        expertWithBoth("Partner naukowy", "Rekomendowane przez fizjoterapeutów"),
      ),
    ).toBe("👉 Zobacz opinię eksperta");
  });

  it("returns generic fallback when data has only unrelated fields", () => {
    expect(
      deriveExpertAnnouncementCta(expert({ expertName: "Dr Jan", quote: "Świetny produkt" })),
    ).toBe("👉 Zobacz opinię eksperta");
  });
});

// ── Priority 1: expertRole ────────────────────────────────────────────────────

describe("expertRole — nominative → genitive conversion", () => {
  it("Pediatra → pediatry", () => {
    expect(deriveExpertAnnouncementCta(expertWithRole("Pediatra"))).toBe(
      "👉 Zobacz opinię pediatry",
    );
  });

  it("pediatra (lowercase) → pediatry", () => {
    expect(deriveExpertAnnouncementCta(expertWithRole("pediatra"))).toBe(
      "👉 Zobacz opinię pediatry",
    );
  });

  it("Fizjoterapeuta → fizjoterapeuty", () => {
    expect(deriveExpertAnnouncementCta(expertWithRole("Fizjoterapeuta"))).toBe(
      "👉 Zobacz opinię fizjoterapeuty",
    );
  });

  it("Fizjoterapeutka → fizjoterapeutki", () => {
    expect(deriveExpertAnnouncementCta(expertWithRole("Fizjoterapeutka"))).toBe(
      "👉 Zobacz opinię fizjoterapeutki",
    );
  });

  it("Ekspert → eksperta", () => {
    expect(deriveExpertAnnouncementCta(expertWithRole("Ekspert"))).toBe(
      "👉 Zobacz opinię eksperta",
    );
  });

  it("Ekspertka → ekspertki", () => {
    expect(deriveExpertAnnouncementCta(expertWithRole("Ekspertka"))).toBe(
      "👉 Zobacz opinię ekspertki",
    );
  });

  it("Specjalista → specjalisty", () => {
    expect(deriveExpertAnnouncementCta(expertWithRole("Specjalista"))).toBe(
      "👉 Zobacz opinię specjalisty",
    );
  });

  it("Neurolog → neurologa", () => {
    expect(deriveExpertAnnouncementCta(expertWithRole("Neurolog"))).toBe(
      "👉 Zobacz opinię neurologa",
    );
  });

  it("Dietetyk → dietetyka", () => {
    expect(deriveExpertAnnouncementCta(expertWithRole("Dietetyk"))).toBe(
      "👉 Zobacz opinię dietetyka",
    );
  });

  it("Psycholog → psychologa", () => {
    expect(deriveExpertAnnouncementCta(expertWithRole("Psycholog"))).toBe(
      "👉 Zobacz opinię psychologa",
    );
  });

  it("Farmaceuta → farmaceuty", () => {
    expect(deriveExpertAnnouncementCta(expertWithRole("Farmaceuta"))).toBe(
      "👉 Zobacz opinię farmaceuty",
    );
  });
});

describe("expertRole — already in genitive", () => {
  it("fizjoterapeuty (already genitive) → fizjoterapeuty", () => {
    expect(deriveExpertAnnouncementCta(expertWithRole("fizjoterapeuty"))).toBe(
      "👉 Zobacz opinię fizjoterapeuty",
    );
  });

  it("pediatry (already genitive) → pediatry", () => {
    expect(deriveExpertAnnouncementCta(expertWithRole("pediatry"))).toBe(
      "👉 Zobacz opinię pediatry",
    );
  });

  it("eksperta (already genitive) → eksperta", () => {
    expect(deriveExpertAnnouncementCta(expertWithRole("eksperta"))).toBe(
      "👉 Zobacz opinię eksperta",
    );
  });
});

describe("expertRole — compound roles (first noun extracted)", () => {
  it("'Fizjoterapeutka, specjalistka kręgosłupa' → fizjoterapeutki", () => {
    expect(
      deriveExpertAnnouncementCta(
        expertWithRole("Fizjoterapeutka, specjalistka kręgosłupa"),
      ),
    ).toBe("👉 Zobacz opinię fizjoterapeutki");
  });

  it("'Specjalista ds. zdrowia i sportu' → specjalisty", () => {
    expect(
      deriveExpertAnnouncementCta(
        expertWithRole("Specjalista ds. zdrowia i sportu"),
      ),
    ).toBe("👉 Zobacz opinię specjalisty");
  });

  it("'Lekarz medycyny sportowej' → lekarza", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithRole("Lekarz medycyny sportowej")),
    ).toBe("👉 Zobacz opinię lekarza");
  });

  it("'Dietetyk kliniczny' → dietetyka", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithRole("Dietetyk kliniczny")),
    ).toBe("👉 Zobacz opinię dietetyka");
  });

  it("'Specjalista pediatrii' → specjalisty (first noun matched)", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithRole("Specjalista pediatrii")),
    ).toBe("👉 Zobacz opinię specjalisty");
  });

  it("unknown first noun falls through to title if available", () => {
    expect(
      deriveExpertAnnouncementCta(
        expertWithBoth("Partner naukowy", "Opinia pediatry"),
      ),
    ).toBe("👉 Zobacz opinię pediatry");
  });
});

// ── Priority 2: title — genitive-headed patterns ──────────────────────────────

describe("title — 'Opinia X' pattern (genitive)", () => {
  it("'Opinia pediatry' → pediatry", () => {
    expect(deriveExpertAnnouncementCta(expertWithTitle("Opinia pediatry"))).toBe(
      "👉 Zobacz opinię pediatry",
    );
  });

  it("'Opinia eksperta' → eksperta", () => {
    expect(deriveExpertAnnouncementCta(expertWithTitle("Opinia eksperta"))).toBe(
      "👉 Zobacz opinię eksperta",
    );
  });

  it("'Opinia specjalisty' → specjalisty", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Opinia specjalisty")),
    ).toBe("👉 Zobacz opinię specjalisty");
  });

  it("'Opinia fizjoterapeuty' → fizjoterapeuty", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Opinia fizjoterapeuty")),
    ).toBe("👉 Zobacz opinię fizjoterapeuty");
  });

  it("'Opinia eksperta medycyny sportowej' → full phrase preserved", () => {
    expect(
      deriveExpertAnnouncementCta(
        expertWithTitle("Opinia eksperta medycyny sportowej"),
      ),
    ).toBe("👉 Zobacz opinię eksperta medycyny sportowej");
  });

  it("'Opinie ekspertów' variant (plural) → phrase preserved", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Opinie ekspertów")),
    ).toBe("👉 Zobacz opinię ekspertów");
  });

  it("'Opinię eksperta' variant (accusative) → phrase preserved", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Opinię eksperta")),
    ).toBe("👉 Zobacz opinię eksperta");
  });
});

describe("title — 'Rekomendacja X' pattern (genitive)", () => {
  it("'Rekomendacja fizjoterapeuty' → fizjoterapeuty", () => {
    expect(
      deriveExpertAnnouncementCta(
        expertWithTitle("Rekomendacja fizjoterapeuty"),
      ),
    ).toBe("👉 Zobacz opinię fizjoterapeuty");
  });

  it("'Rekomendacja pediatry' → pediatry", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Rekomendacja pediatry")),
    ).toBe("👉 Zobacz opinię pediatry");
  });

  it("'Rekomendacje specjalistów' (plural) → phrase preserved", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Rekomendacje specjalistów")),
    ).toBe("👉 Zobacz opinię specjalistów");
  });
});

describe("title — 'Zdanie X' / 'Słowo X' / 'Głos X' patterns (genitive)", () => {
  it("'Zdanie eksperta' → eksperta", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Zdanie eksperta")),
    ).toBe("👉 Zobacz opinię eksperta");
  });

  it("'Zdanie specjalisty' → specjalisty", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Zdanie specjalisty")),
    ).toBe("👉 Zobacz opinię specjalisty");
  });

  it("'Słowo eksperta' → eksperta", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Słowo eksperta")),
    ).toBe("👉 Zobacz opinię eksperta");
  });

  it("'Głos eksperta' → eksperta", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Głos eksperta")),
    ).toBe("👉 Zobacz opinię eksperta");
  });
});

// ── Priority 2: title — nominative-headed patterns ────────────────────────────

describe("title — 'Co mówi X?' pattern (nominative → convert)", () => {
  it("'Co mówi pediatra?' → pediatry", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Co mówi pediatra?")),
    ).toBe("👉 Zobacz opinię pediatry");
  });

  it("'Co mówi ekspert' (no question mark) → eksperta", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Co mówi ekspert")),
    ).toBe("👉 Zobacz opinię eksperta");
  });

  it("'Co mówi fizjoterapeuta?' → fizjoterapeuty", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Co mówi fizjoterapeuta?")),
    ).toBe("👉 Zobacz opinię fizjoterapeuty");
  });

  it("'Co mówi Partner?' → fallback (unknown noun)", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Co mówi Partner?")),
    ).toBe("👉 Zobacz opinię eksperta");
  });
});

describe("title — 'Co sądzi X?' pattern (nominative → convert)", () => {
  it("'Co sądzi specjalista?' → specjalisty", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Co sądzi specjalista?")),
    ).toBe("👉 Zobacz opinię specjalisty");
  });

  it("'Co sądzi ekspert' → eksperta", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Co sądzi ekspert")),
    ).toBe("👉 Zobacz opinię eksperta");
  });
});

describe("title — '[X] poleca / rekomenduje / mówi' pattern (nominative → convert)", () => {
  it("'Pediatra poleca' → pediatry", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Pediatra poleca")),
    ).toBe("👉 Zobacz opinię pediatry");
  });

  it("'Ekspert poleca' (special-cased) → eksperta", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Ekspert poleca")),
    ).toBe("👉 Zobacz opinię eksperta");
  });

  it("'Fizjoterapeuta rekomenduje' → fizjoterapeuty", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Fizjoterapeuta rekomenduje")),
    ).toBe("👉 Zobacz opinię fizjoterapeuty");
  });

  it("'Neurolog mówi' → neurologa", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Neurolog mówi")),
    ).toBe("👉 Zobacz opinię neurologa");
  });

  it("'Nieznany poleca' → fallback (unknown noun)", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Nieznany poleca")),
    ).toBe("👉 Zobacz opinię eksperta");
  });
});

// ── Non-matching title patterns → fallback ────────────────────────────────────

describe("title — non-matching patterns fall back safely", () => {
  it("'Rekomendowane przez fizjoterapeutów' → fallback", () => {
    // Instrumental/plural — can't safely derive singular genitive.
    expect(
      deriveExpertAnnouncementCta(
        expertWithTitle("Rekomendowane przez fizjoterapeutów"),
      ),
    ).toBe("👉 Zobacz opinię eksperta");
  });

  it("'Sprawdzone przez ekspertów' → fallback", () => {
    expect(
      deriveExpertAnnouncementCta(
        expertWithTitle("Sprawdzone przez ekspertów"),
      ),
    ).toBe("👉 Zobacz opinię eksperta");
  });

  it("'Nasze innowacyjne podejście' → fallback", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("Nasze innowacyjne podejście")),
    ).toBe("👉 Zobacz opinię eksperta");
  });

  it("empty title string → fallback", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithTitle("")),
    ).toBe("👉 Zobacz opinię eksperta");
  });
});

// ── Priority order: role always wins over title ───────────────────────────────

describe("priority: expertRole takes precedence over title", () => {
  it("role='Pediatra', title='Opinia eksperta' → pediatry (role wins)", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithBoth("Pediatra", "Opinia eksperta")),
    ).toBe("👉 Zobacz opinię pediatry");
  });

  it("role='Fizjoterapeuta', title='Opinia pediatry' → fizjoterapeuty (role wins)", () => {
    expect(
      deriveExpertAnnouncementCta(
        expertWithBoth("Fizjoterapeuta", "Opinia pediatry"),
      ),
    ).toBe("👉 Zobacz opinię fizjoterapeuty");
  });

  it("role='Ekspert, doradca', title='Opinia pediatry' → eksperta (role wins)", () => {
    expect(
      deriveExpertAnnouncementCta(
        expertWithBoth("Ekspert, doradca", "Opinia pediatry"),
      ),
    ).toBe("👉 Zobacz opinię eksperta");
  });
});

describe("priority: title used when role is empty or unrecognised", () => {
  it("role='', title='Opinia pediatry' → pediatry (falls through to title)", () => {
    expect(
      deriveExpertAnnouncementCta(expertWithBoth("", "Opinia pediatry")),
    ).toBe("👉 Zobacz opinię pediatry");
  });

  it("role='Partner naukowy', title='Zdanie eksperta' → eksperta (title used after role fails)", () => {
    expect(
      deriveExpertAnnouncementCta(
        expertWithBoth("Partner naukowy", "Zdanie eksperta"),
      ),
    ).toBe("👉 Zobacz opinię eksperta");
  });

  it("role='Doradca handlowy', title='Rekomendacja fizjoterapeuty' → fizjoterapeuty (title used)", () => {
    expect(
      deriveExpertAnnouncementCta(
        expertWithBoth("Doradca handlowy", "Rekomendacja fizjoterapeuty"),
      ),
    ).toBe("👉 Zobacz opinię fizjoterapeuty");
  });
});

// ── Real-world scenario matrix ────────────────────────────────────────────────

describe("real-world scenarios", () => {
  it("physio product with full Expert section data", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({
          title: "Rekomendowane przez fizjoterapeutów",
          description: "Współpracujemy z certyfikowanymi specjalistami.",
          expertName: "Dr Anna Kowalska",
          expertRole: "Fizjoterapeutka, specjalistka kręgosłupa",
          expertImage: "/images/avatar.jpg",
          quote: "Ten produkt znacząco poprawia komfort.",
        }),
      ),
    ).toBe("👉 Zobacz opinię fizjoterapeutki");
  });

  it("paediatrics product: role='Pediatra', title='Opinia pediatry'", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ expertRole: "Pediatra", title: "Opinia pediatry" }),
      ),
    ).toBe("👉 Zobacz opinię pediatry");
  });

  it("nutrition product: role='Dietetyk kliniczny', title='Co mówi dietetyk?'", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({
          expertRole: "Dietetyk kliniczny",
          title: "Co mówi dietetyk?",
        }),
      ),
    ).toBe("👉 Zobacz opinię dietetyka");
  });

  it("mental health product: role='Psycholog', title='Zdanie psychologa'", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ expertRole: "Psycholog", title: "Zdanie psychologa" }),
      ),
    ).toBe("👉 Zobacz opinię psychologa");
  });

  it("sports product: role='Trener personalny', title='Ekspert poleca'", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ expertRole: "Trener personalny", title: "Ekspert poleca" }),
      ),
    ).toBe("👉 Zobacz opinię trenera");
  });

  it("pharmacy product: role='Farmaceuta', title='Rekomendacja farmaceuty'", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ expertRole: "Farmaceuta", title: "Rekomendacja farmaceuty" }),
      ),
    ).toBe("👉 Zobacz opinię farmaceuty");
  });

  it("generic product: no role, generic title → fallback", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({
          expertName: "Dr Jan Nowak",
          title: "Sprawdzone przez ekspertów",
          quote: "Polecam ten produkt.",
        }),
      ),
    ).toBe("👉 Zobacz opinię eksperta");
  });

  it("Expert section with non-standard fields only → fallback", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ subtitle: "Najlepszy na rynku", badge: "Certyfikowane" }),
      ),
    ).toBe("👉 Zobacz opinię eksperta");
  });
});

// ── Legacy field fallbacks (pre-contract-enforcement storefronts) ─────────────
//
// Old AI-generated storefronts may store the specialist role under field names
// that predate the canonical contract:
//   • "credentials" — aliased to "expertRole" by SectionContractEnforcer, but
//     storefronts generated before the alias was deployed keep the old key.
//   • "role" — never added to the alias list; stripped as an unknown field by
//     the enforcer, leaving expertRole absent in stored data.
//
// These tests verify that deriveExpertAnnouncementCta handles both legacy
// shapes without requiring a backend data migration or storefront republish.

describe("legacy field fallback — credentials (pre-alias storefronts)", () => {
  it("data.credentials used when expertRole absent: 'Fizjoterapeutka' → fizjoterapeutki", () => {
    expect(
      deriveExpertAnnouncementCta(expert({ credentials: "Fizjoterapeutka" })),
    ).toBe("👉 Zobacz opinię fizjoterapeutki");
  });

  it("data.credentials used when expertRole absent: 'Pediatra' → pediatry", () => {
    expect(
      deriveExpertAnnouncementCta(expert({ credentials: "Pediatra" })),
    ).toBe("👉 Zobacz opinię pediatry");
  });

  it("data.credentials used when expertRole absent: 'Dietetyk kliniczny' → dietetyka", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ credentials: "Dietetyk kliniczny" }),
      ),
    ).toBe("👉 Zobacz opinię dietetyka");
  });

  it("expertRole takes priority over credentials when both are present", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ expertRole: "Pediatra", credentials: "Fizjoterapeutka" }),
      ),
    ).toBe("👉 Zobacz opinię pediatry");
  });

  it("falls through to title when credentials is unrecognised", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ credentials: "Partner naukowy", title: "Opinia eksperta" }),
      ),
    ).toBe("👉 Zobacz opinię eksperta");
  });
});

describe("legacy field fallback — role (never aliased, stripped by enforcer)", () => {
  it("data.role used when expertRole absent: 'Fizjoterapeuta' → fizjoterapeuty", () => {
    expect(
      deriveExpertAnnouncementCta(expert({ role: "Fizjoterapeuta" })),
    ).toBe("👉 Zobacz opinię fizjoterapeuty");
  });

  it("data.role used when expertRole absent: 'Specjalista ds. zdrowia' → specjalisty", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ role: "Specjalista ds. zdrowia" }),
      ),
    ).toBe("👉 Zobacz opinię specjalisty");
  });

  it("expertRole takes priority over role when both are present", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ expertRole: "Pediatra", role: "Fizjoterapeuta" }),
      ),
    ).toBe("👉 Zobacz opinię pediatry");
  });

  it("credentials takes priority over role when expertRole is absent", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ credentials: "Pediatra", role: "Fizjoterapeuta" }),
      ),
    ).toBe("👉 Zobacz opinię pediatry");
  });

  it("falls through to title when role is unrecognised", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ role: "Partner naukowy", title: "Opinia fizjoterapeuty" }),
      ),
    ).toBe("👉 Zobacz opinię fizjoterapeuty");
  });

  it("falls through to fallback when role is unrecognised and title is absent", () => {
    expect(
      deriveExpertAnnouncementCta(expert({ role: "Partner naukowy" })),
    ).toBe("👉 Zobacz opinię eksperta");
  });
});

// ── Robustness: non-string field values ignored gracefully ────────────────────

describe("robustness — non-string field values", () => {
  it("expertRole = number → ignored, falls through to title", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ expertRole: 42, title: "Opinia pediatry" }),
      ),
    ).toBe("👉 Zobacz opinię pediatry");
  });

  it("title = null → falls through to fallback", () => {
    expect(
      deriveExpertAnnouncementCta(expert({ expertRole: null, title: null })),
    ).toBe("👉 Zobacz opinię eksperta");
  });

  it("title = array → ignored, falls through to fallback", () => {
    expect(
      deriveExpertAnnouncementCta(
        expert({ expertRole: [], title: ["Opinia", "pediatry"] }),
      ),
    ).toBe("👉 Zobacz opinię eksperta");
  });
});
