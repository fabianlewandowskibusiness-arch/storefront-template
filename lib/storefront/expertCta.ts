/**
 * Expert section → announcement CTA derivation.
 *
 * Derives a natural-sounding Polish CTA for the announcement strip from the
 * Expert section data already present in the storefront runtime config.
 *
 * ## Priority chain
 *   1. `expertRole` — direct specialist role field, highest signal.
 *      Tries to convert the first noun to genitive via dictionary lookup.
 *   2. `title`      — section heading, matched against several Polish
 *      structural patterns. Genitive-headed patterns use the extracted
 *      phrase directly; nominative-headed patterns convert via dictionary.
 *   3. Safe fallback — "👉 Zobacz opinię eksperta" when the Expert section
 *      exists but neither field yields a clean derivation.
 *
 * ## Contract
 *   - No backend changes. Uses only data already in StorefrontSection.data.
 *   - Returns null only when no Expert section is present (→ caller keeps
 *     original announcement items unchanged).
 *   - Returns a non-null string whenever an Expert section exists (the
 *     caller may then replace matching announcement items).
 *
 * ## Polish grammar note
 *   The CTA format is "👉 Zobacz opinię [genitive]".
 *   "opinię" is accusative of "opinia"; the specialist noun must be in the
 *   genitive case (dopełniacz). The dictionary maps both nominative and
 *   genitive input forms to the correct genitive output.
 */

// ── Genitive dictionary ───────────────────────────────────────────────────────
//
// Keys: lower-case nominative OR genitive forms of common specialist nouns.
// Values: always the genitive form — the form required after "opinię".
//
// Dual-form entries (nom → gen AND gen → gen) allow the same lookup to work
// regardless of whether the source text is already in genitive or not.

const GENITIVE: Readonly<Record<string, string>> = {
  // ── Medical — general ────────────────────────────────────────────────────
  lekarz:          "lekarza",
  lekarka:         "lekarki",
  lekarza:         "lekarza",
  lekarki:         "lekarki",
  doktor:          "doktora",
  doktora:         "doktora",
  doktorka:        "doktorki",
  doktorki:        "doktorki",
  // ── Paediatrics ──────────────────────────────────────────────────────────
  pediatra:        "pediatry",
  pediatry:        "pediatry",
  // ── Orthopaedics / neurology ─────────────────────────────────────────────
  ortopeda:        "ortopedy",
  ortopedy:        "ortopedy",
  neurolog:        "neurologa",
  neurologa:       "neurologa",
  // ── Cardiology / pulmonology ─────────────────────────────────────────────
  kardiolog:       "kardiologa",
  kardiologa:      "kardiologa",
  pulmonolog:      "pulmonologa",
  pulmonologa:     "pulmonologa",
  // ── Dermatology / aesthetics ─────────────────────────────────────────────
  dermatolog:      "dermatologa",
  dermatologa:     "dermatologa",
  kosmetolog:      "kosmetologa",
  kosmetologa:     "kosmetologa",
  "kosmetolożka":  "kosmetolożki",
  "kosmetolożki":  "kosmetolożki",
  // ── Endocrinology / gastroenterology ─────────────────────────────────────
  endokrynolog:    "endokrynologa",
  endokrynologa:   "endokrynologa",
  gastroenterolog: "gastroenterologa",
  gastroenterologa:"gastroenterologa",
  // ── Physiotherapy / rehabilitation ───────────────────────────────────────
  fizjoterapeuta:  "fizjoterapeuty",
  fizjoterapeutka: "fizjoterapeutki",
  fizjoterapeuty:  "fizjoterapeuty",
  fizjoterapeutki: "fizjoterapeutki",
  rehabilitant:    "rehabilitanta",
  rehabilitanta:   "rehabilitanta",
  // ── Therapy ──────────────────────────────────────────────────────────────
  terapeuta:       "terapeuty",
  terapeutka:      "terapeutki",
  terapeuty:       "terapeuty",
  terapeutki:      "terapeutki",
  // ── Nutrition / dietetics ────────────────────────────────────────────────
  dietetyk:        "dietetyka",
  dietetyczka:     "dietetyczki",
  dietetyka:       "dietetyka",
  dietetyczki:     "dietetyczki",
  "żywieniowiec":  "żywieniowca",
  "żywieniowca":   "żywieniowca",
  // ── Sport / fitness ──────────────────────────────────────────────────────
  trener:          "trenera",
  trenerka:        "trenerki",
  trenera:         "trenera",
  trenerki:        "trenerki",
  instruktor:      "instruktora",
  instruktorka:    "instruktorki",
  instruktora:     "instruktora",
  instruktorki:    "instruktorki",
  // ── Psychology ───────────────────────────────────────────────────────────
  psycholog:       "psychologa",
  "psycholożka":   "psycholożki",
  psychologa:      "psychologa",
  "psycholożki":   "psycholożki",
  // ── Pharmacy ─────────────────────────────────────────────────────────────
  farmaceuta:      "farmaceuty",
  farmaceutka:     "farmaceutki",
  farmaceuty:      "farmaceuty",
  farmaceutki:     "farmaceutki",
  // ── Engineering / technology ─────────────────────────────────────────────
  inżynier:        "inżyniera",
  inżyniera:       "inżyniera",
  technolog:       "technologa",
  technologa:      "technologa",
  // ── Generic catch-all ────────────────────────────────────────────────────
  ekspert:         "eksperta",
  ekspertka:       "ekspertki",
  eksperta:        "eksperta",
  ekspertki:       "ekspertki",
  specjalista:     "specjalisty",
  specjalistka:    "specjalistki",
  specjalisty:     "specjalisty",
  specjalistki:    "specjalistki",
  konsultant:      "konsultanta",
  konsultantka:    "konsultantki",
  konsultanta:     "konsultanta",
  konsultantki:    "konsultantki",
};

/** Safe fallback CTA used when the Expert section exists but cannot be parsed. */
const FALLBACK_CTA = "👉 Zobacz opinię eksperta";

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Looks up a single word in the genitive dictionary (case-insensitive).
 * Accepts both nominative and genitive input; always returns genitive.
 * Returns null when the word is not in the dictionary.
 */
function toGenitive(word: string): string | null {
  return GENITIVE[word.toLowerCase().trim()] ?? null;
}

/**
 * Extracts the leading specialist noun from an `expertRole` string and
 * converts it to genitive via dictionary lookup.
 *
 * Strategy:
 *   1. Split on comma, semicolon, em-dash, en-dash, or regular hyphen.
 *   2. Take the first segment (e.g. "Fizjoterapeutka" from "Fizjoterapeutka, specjalistka…").
 *   3. Take the first whitespace-separated token of that segment.
 *   4. Look it up in the genitive dictionary.
 *
 * Returns null when the role string is empty or the leading noun is not in
 * the dictionary (avoids exposing unrecognised words in the UI).
 *
 * Examples:
 *   "Pediatra"                        → "pediatry"
 *   "Fizjoterapeutka, specjalistka …" → "fizjoterapeutki"
 *   "Specjalista ds. zdrowia"         → "specjalisty"
 *   "Lekarz medycyny sportowej"       → "lekarza"
 *   "fizjoterapeuty"                  → "fizjoterapeuty"  (already genitive)
 *   "Partner naukowy"                 → null  (unknown noun)
 */
function extractFromRole(role: string): string | null {
  const trimmed = role.trim();
  if (!trimmed) return null;
  const firstSegment = trimmed.split(/[,;—–\-]/)[0].trim();
  const firstWord = firstSegment.split(/\s+/)[0];
  return toGenitive(firstWord);
}

/**
 * Parses the Expert section `title` field to extract a genitive specialist
 * phrase for use in the CTA.
 *
 * Supports two classes of patterns:
 *
 * **Genitive-headed** — the phrase after the keyword is already in the
 * genitive case; returned as-is.
 *   "Opinia/Opinie/Opinię [X]"          → X
 *   "Rekomendacja/Rekomendacje [X]"     → X
 *   "Zdanie [X]"                        → X
 *   "Słowo [X]"                         → X
 *   "Głos [X]"                          → X
 *
 * **Nominative-headed** — the subject word is in nominative; converted via
 * dictionary. Falls through silently when conversion is not possible.
 *   "Co mówi [X]?"                      → toGenitive(X)
 *   "Co sądzi [X]?"                     → toGenitive(X)
 *   "Co poleca [X]?"                    → toGenitive(X)
 *   "[X] poleca"                        → toGenitive(X)
 *   "[X] rekomenduje"                   → toGenitive(X)
 *   "[X] mówi"                          → toGenitive(X)
 *   "Ekspert poleca"                    → "eksperta"  (special-cased)
 *
 * Returns null when no pattern matches or when nominative conversion fails.
 */
function extractFromTitle(title: string): string | null {
  const t = title.trim();
  if (!t) return null;

  // ── Genitive-headed patterns ─────────────────────────────────────────────
  // The rest of the phrase after the keyword is expected to be in genitive.
  const genitivePatterns: RegExp[] = [
    /^Opini[aeę]\s+(.+)$/iu,          // Opinia/Opinie/Opinię X
    /^Rekomendacj[ae]\s+(.+)$/iu,     // Rekomendacja/Rekomendacje X
    /^Zdanie\s+(.+)$/iu,              // Zdanie X
    /^S[łl]owo\s+(.+)$/iu,           // Słowo X  (tolerates missing diacritic)
    /^G[łl]os\s+(.+)$/iu,            // Głos X
  ];
  for (const rx of genitivePatterns) {
    const m = t.match(rx);
    if (m) return m[1].trim();
  }

  // ── Special-cased nominative patterns ────────────────────────────────────
  // "Ekspert poleca" is extremely common and has no variable part.
  if (/^Ekspert\s+poleca\s*$/iu.test(t)) return "eksperta";

  // ── Variable nominative patterns ─────────────────────────────────────────
  // Subject noun(s) are in nominative; we try to convert the first one.
  const nominativePatterns: RegExp[] = [
    /^Co\s+m[oó]wi\s+(.+?)\??\s*$/iu,     // Co mówi [X]?
    /^Co\s+s[aą]dzi\s+(.+?)\??\s*$/iu,   // Co sądzi [X]?
    /^Co\s+poleca\s+(.+?)\??\s*$/iu,      // Co poleca [X]?
    /^(.+?)\s+poleca\s*$/iu,              // [X] poleca
    /^(.+?)\s+rekomenduje\s*$/iu,         // [X] rekomenduje
    /^(.+?)\s+m[oó]wi\s*$/iu,            // [X] mówi
  ];
  for (const rx of nominativePatterns) {
    const m = t.match(rx);
    if (m) {
      const firstWord = m[1].trim().split(/\s+/)[0];
      const gen = toGenitive(firstWord);
      if (gen) return gen;
    }
  }

  // No match — caller falls through to fallback.
  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Minimal shape needed from each section — satisfied by StorefrontSection.
 * Using a structural type keeps this module independent of the storefront
 * type definitions and therefore trivially unit-testable.
 */
export interface SectionLike {
  type: string;
  data: Record<string, unknown> | null;
}

/**
 * Derives a natural-sounding Polish expert CTA for the announcement strip.
 *
 * @param sections — All sections on the page (e.g. `homePage.sections`).
 * @returns A CTA string like "👉 Zobacz opinię pediatry", the safe generic
 *   fallback "👉 Zobacz opinię eksperta" when the Expert section exists but
 *   cannot be parsed, or `null` when no Expert section is present at all.
 *   `null` signals the caller to leave announcement items unchanged.
 */
export function deriveExpertAnnouncementCta(
  sections: readonly SectionLike[],
): string | null {
  const expert = sections.find((s) => s.type === "EXPERT");

  // No Expert section → don't touch the announcement strip.
  if (!expert) return null;

  const data = expert.data ?? {};

  // Priority 1 — expertRole
  const role =
    typeof data.expertRole === "string" ? (data.expertRole as string) : "";
  if (role) {
    const gen = extractFromRole(role);
    if (gen) return `👉 Zobacz opinię ${gen}`;
  }

  // Priority 2 — title
  const title =
    typeof data.title === "string" ? (data.title as string) : "";
  if (title) {
    const gen = extractFromTitle(title);
    if (gen) return `👉 Zobacz opinię ${gen}`;
  }

  // Fallback — Expert section exists, but neither field is parseable.
  // Return a safe generic CTA rather than null so any stale hardcoded text
  // in the announcement strip still gets replaced with something correct.
  return FALLBACK_CTA;
}
