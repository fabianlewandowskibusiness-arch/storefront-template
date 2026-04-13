import type { SellerConfig, LegalPageKey } from "@/types/storefront";

/**
 * A section within a legal page — heading + body paragraphs.
 */
export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

/**
 * Generates structured legal content for a page type using seller data.
 *
 * This is an MVP template system — not AI-generated. Each page type has a
 * static Polish template with seller data interpolated at known positions.
 * The templates are intentionally generic and legally conservative.
 */
export function generateLegalContent(
  pageKey: LegalPageKey,
  seller: SellerConfig,
): LegalSection[] {
  switch (pageKey) {
    case "returns":
      return returnsTemplate(seller);
    case "shipping":
      return shippingTemplate(seller);
    case "privacy":
      return privacyTemplate(seller);
    case "terms":
      return termsTemplate(seller);
    case "contact":
      return contactTemplate(seller);
    default:
      return [];
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function or(value: string, fallback: string): string {
  return value.trim() || fallback;
}

// ── Returns ─────────────────────────────────────────────────────────────────

function returnsTemplate(s: SellerConfig): LegalSection[] {
  const days = s.returnPolicyDays || 14;
  const company = or(s.legalCompanyName, s.storeName);
  const email = or(s.contactEmail, "kontakt@sklep.pl");

  return [
    {
      heading: "Prawo do odstąpienia od umowy",
      paragraphs: [
        `Masz prawo odstąpić od umowy zawartej na odległość w terminie ${days} dni bez podawania przyczyny. Termin do odstąpienia wygasa po upływie ${days} dni od dnia, w którym wszedłeś w posiadanie rzeczy lub w którym osoba trzecia inna niż przewoźnik i przez Ciebie wskazana weszła w posiadanie rzeczy.`,
        `Aby skorzystać z prawa odstąpienia od umowy, musisz poinformować nas (${company}, ${or(s.businessAddress, "adres do korespondencji")}, e-mail: ${email}) o swojej decyzji o odstąpieniu od umowy w drodze jednoznacznego oświadczenia.`,
      ],
    },
    {
      heading: "Jak dokonać zwrotu",
      paragraphs: [
        "1. Skontaktuj się z nami e-mailowo, podając numer zamówienia.",
        "2. Otrzymasz potwierdzenie przyjęcia zwrotu wraz z instrukcją wysyłki.",
        `3. Odeślij produkt w stanie nienaruszonym w ciągu ${days} dni od daty zgłoszenia.`,
        `4. Zwrot środków nastąpi w ciągu 14 dni roboczych od otrzymania przesyłki zwrotnej na ten sam środek płatności, którym dokonano zakupu.`,
      ],
    },
    {
      heading: "Warunki zwrotu",
      paragraphs: [
        "Zwracany produkt musi być w stanie nienaruszonym, w oryginalnym opakowaniu, z kompletem metek i akcesoriów.",
        "Koszty odesłania produktu ponosi kupujący, chyba że produkt jest wadliwy.",
      ],
    },
    {
      heading: "Reklamacje",
      paragraphs: [
        `Reklamacje dotyczące wad produktu prosimy kierować na adres e-mail: ${email}.`,
        `Rozpatrzenie reklamacji następuje w terminie 14 dni od daty jej otrzymania. O wyniku reklamacji zostaniesz poinformowany drogą elektroniczną.`,
      ],
    },
  ];
}

// ── Shipping ────────────────────────────────────────────────────────────────

function shippingTemplate(s: SellerConfig): LegalSection[] {
  const countries = or(s.shippingCountries, "Polska");

  return [
    {
      heading: "Dostawa",
      paragraphs: [
        `Realizujemy wysyłkę na terenie: ${countries}.`,
        "Zamówienia złożone w dni robocze do godziny 14:00 są wysyłane tego samego dnia. Zamówienia złożone po tej godzinie lub w weekendy realizujemy następnego dnia roboczego.",
      ],
    },
    {
      heading: "Czas i koszt dostawy",
      paragraphs: [
        "Standardowa dostawa kurierem: 1–3 dni robocze.",
        "Dostawa do paczkomatu: 1–2 dni robocze.",
        "Koszt dostawy jest wyświetlany przy składaniu zamówienia i zależy od wybranej metody wysyłki. Szczegóły kosztów znajdziesz na stronie produktu.",
      ],
    },
    {
      heading: "Śledzenie przesyłki",
      paragraphs: [
        "Po wysłaniu zamówienia otrzymasz e-mail z numerem przesyłki i linkiem do śledzenia. Jeśli nie otrzymałeś wiadomości, sprawdź folder SPAM lub skontaktuj się z nami.",
      ],
    },
  ];
}

// ── Privacy ─────────────────────────────────────────────────────────────────

function privacyTemplate(s: SellerConfig): LegalSection[] {
  const company = or(s.legalCompanyName, s.storeName);
  const controller = or(s.dataControllerName, company);
  const controllerAddr = or(s.dataControllerAddress, or(s.businessAddress, "adres firmy"));
  const email = or(s.contactEmail, "kontakt@sklep.pl");
  const url = or(s.storeUrl, "adres sklepu");

  return [
    {
      heading: "Administrator danych osobowych",
      paragraphs: [
        `Administratorem Twoich danych osobowych jest ${controller}, z siedzibą pod adresem: ${controllerAddr}.`,
        `Kontakt z administratorem: ${email}.`,
      ],
    },
    {
      heading: "Zakres zbieranych danych",
      paragraphs: [
        "Zbieramy dane osobowe niezbędne do realizacji zamówień: imię i nazwisko, adres dostawy, adres e-mail, numer telefonu, dane do faktury.",
        "Podczas korzystania ze sklepu mogą być zbierane dane techniczne (adres IP, rodzaj przeglądarki, czas wizyty) w celu zapewnienia prawidłowego działania serwisu.",
      ],
    },
    {
      heading: "Cel przetwarzania danych",
      paragraphs: [
        "Twoje dane przetwarzamy w celu: realizacji zamówienia, obsługi reklamacji i zwrotów, komunikacji dotyczącej zamówienia, wypełnienia obowiązków prawnych (np. księgowość, podatki).",
        "Za Twoją zgodą — również w celach marketingowych (newsletter, informacje o promocjach).",
      ],
    },
    {
      heading: "Prawa użytkownika",
      paragraphs: [
        "Masz prawo do: dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych oraz wniesienia sprzeciwu wobec przetwarzania.",
        `Aby skorzystać z powyższych praw, skontaktuj się z nami: ${email}.`,
      ],
    },
    {
      heading: "Pliki cookies",
      paragraphs: [
        `Strona ${url} wykorzystuje pliki cookies w celu zapewnienia prawidłowego działania serwisu, analizy ruchu oraz personalizacji treści. Możesz zarządzać ustawieniami cookies w swojej przeglądarce.`,
      ],
    },
  ];
}

// ── Terms ───────────────────────────────────────────────────────────────────

function termsTemplate(s: SellerConfig): LegalSection[] {
  const company = or(s.legalCompanyName, s.storeName);
  const address = or(s.businessAddress, "adres firmy");
  const vat = s.vatNumber ? `NIP: ${s.vatNumber}` : "";
  const email = or(s.contactEmail, "kontakt@sklep.pl");
  const url = or(s.storeUrl, "adres sklepu");

  return [
    {
      heading: "Postanowienia ogólne",
      paragraphs: [
        `Sklep internetowy dostępny pod adresem ${url} prowadzony jest przez ${company}, z siedzibą pod adresem: ${address}.${vat ? ` ${vat}.` : ""}`,
        "Niniejszy regulamin określa zasady korzystania ze sklepu, składania zamówień, dostawy, płatności oraz reklamacji i zwrotów.",
      ],
    },
    {
      heading: "Składanie zamówień",
      paragraphs: [
        "Zamówienia można składać za pośrednictwem strony internetowej sklepu.",
        "Złożenie zamówienia stanowi ofertę zakupu w rozumieniu Kodeksu Cywilnego. Umowa sprzedaży zostaje zawarta z chwilą potwierdzenia przyjęcia zamówienia przez sklep.",
      ],
    },
    {
      heading: "Ceny i płatności",
      paragraphs: [
        "Wszystkie ceny podane w sklepie są cenami brutto (zawierają VAT).",
        "Dostępne metody płatności są wyświetlane przy składaniu zamówienia. Szczegóły dotyczące poszczególnych metod płatności znajdziesz na stronie zamówienia.",
      ],
    },
    {
      heading: "Dostawa",
      paragraphs: [
        "Szczegóły dotyczące metod i kosztów dostawy znajdują się na stronie \"Wysyłka i dostawa\".",
      ],
    },
    {
      heading: "Reklamacje i zwroty",
      paragraphs: [
        "Szczegóły dotyczące procedury reklamacji i zwrotów znajdują się na stronie \"Zwroty i reklamacje\".",
      ],
    },
    {
      heading: "Dane kontaktowe",
      paragraphs: [
        `W razie pytań prosimy o kontakt: ${email}.`,
      ],
    },
  ];
}

// ── Contact ─────────────────────────────────────────────────────────────────

function contactTemplate(s: SellerConfig): LegalSection[] {
  const company = or(s.legalCompanyName, s.storeName);
  const email = or(s.contactEmail, "kontakt@sklep.pl");

  const paragraphs: string[] = [
    `Właściciel sklepu: ${company}.`,
  ];

  if (s.businessAddress) paragraphs.push(`Adres: ${s.businessAddress}.`);
  if (s.vatNumber) paragraphs.push(`NIP: ${s.vatNumber}.`);
  paragraphs.push(`E-mail: ${email}.`);
  if (s.contactPhone) paragraphs.push(`Telefon: ${s.contactPhone}.`);

  return [
    {
      heading: "Dane kontaktowe",
      paragraphs,
    },
    {
      heading: "Godziny obsługi",
      paragraphs: [
        "Odpowiadamy na wiadomości e-mail w dni robocze, zazwyczaj w ciągu 24 godzin.",
        "W przypadku pilnych spraw prosimy o kontakt telefoniczny.",
      ],
    },
  ];
}
