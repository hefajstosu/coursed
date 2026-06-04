import type { Metadata } from "next";

// UWAGA: dokument jest rzetelnym szablonem zgodnym z RODO, ale przed publikacją
// powinien zostać uzupełniony danymi operatora ([NAZWA/ADRES/EMAIL]) oraz
// zweryfikowany przez prawnika. Placeholdery oznaczono nawiasami [ ].

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description:
    "Jak coursed.pl przetwarza dane osobowe — zakres, cele, podstawy prawne i Twoje prawa zgodnie z RODO.",
  alternates: { canonical: "/polityka-prywatnosci" },
};

const CONTACT_EMAIL = "kontakt@coursed.pl";

const TOC = [
  { id: "administrator", label: "Administrator danych" },
  { id: "zakres", label: "Jakie dane zbieramy" },
  { id: "cele", label: "Cele i podstawy prawne" },
  { id: "podmioty", label: "Komu powierzamy dane" },
  { id: "retencja", label: "Okres przechowywania" },
  { id: "prawa", label: "Twoje prawa" },
  { id: "cookies", label: "Pliki cookies" },
  { id: "kontakt", label: "Kontakt" },
];

export default function PolitykaPrywatnosciPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-10 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Dokument prawny
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Polityka prywatności
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Wyjaśniamy, jakie dane osobowe przetwarzamy w serwisie coursed.pl, w
          jakim celu i na jakiej podstawie, oraz jakie prawa Ci przysługują
          zgodnie z RODO.
        </p>
      </header>

      <nav
        aria-label="Spis treści"
        className="mb-10 rounded-lg border border-border bg-muted/30 p-4"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Spis treści
        </p>
        <ol className="grid gap-1.5 text-sm sm:grid-cols-2">
          {TOC.map((t, i) => (
            <li key={t.id}>
              <a href={`#${t.id}`} className="text-muted-foreground hover:text-foreground">
                <span className="tabular-nums text-xs mr-2">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {t.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-10">
        <Section id="administrator" title="Administrator danych">
          <p>
            Administratorem danych osobowych jest operator serwisu coursed.pl —
            [NAZWA OPERATORA], [ADRES], NIP [NIP]. W sprawach dotyczących danych
            osobowych możesz kontaktować się pod adresem{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4 hover:text-foreground">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section id="zakres" title="Jakie dane zbieramy">
          <p>W zależności od sposobu korzystania z serwisu przetwarzamy:</p>
          <Rules
            items={[
              { k: "Konto", v: "adres e-mail; opcjonalnie imię/nazwa i awatar pobrane z Google przy logowaniu OAuth" },
              { k: "Treści", v: "wystawione oceny (1–10), opinie, głosy pomocności i zgłoszenia" },
              { k: "Zgłoszenie kursu", v: "tytuł, adres URL, opcjonalny e-mail i notatka z formularza" },
              { k: "Dane techniczne", v: "adres IP (do limitowania nadużyć), data i czas zdarzeń, logi błędów" },
              { k: "Cookies", v: "techniczny token sesji oraz zapis Twojej zgody na cookies" },
            ]}
          />
        </Section>

        <Section id="cele" title="Cele i podstawy prawne">
          <Rules
            items={[
              { k: "Prowadzenie konta i logowanie", v: "art. 6 ust. 1 lit. b RODO (umowa)" },
              { k: "Publikacja ocen i opinii", v: "art. 6 ust. 1 lit. b RODO (umowa)" },
              { k: "Bezpieczeństwo, anty-spam, limity", v: "art. 6 ust. 1 lit. f RODO (uzasadniony interes)" },
              { k: "Wysyłka linków logowania (e-mail)", v: "art. 6 ust. 1 lit. b RODO" },
              { k: "Obsługa zgłoszeń i moderacja", v: "art. 6 ust. 1 lit. f RODO" },
              { k: "Wypełnienie obowiązków prawnych", v: "art. 6 ust. 1 lit. c RODO" },
            ]}
          />
        </Section>

        <Section id="podmioty" title="Komu powierzamy dane">
          <p>
            Korzystamy z zaufanych dostawców, którzy przetwarzają dane wyłącznie
            na nasze polecenie (procesorzy):
          </p>
          <Rules
            items={[
              { k: "Vercel", v: "hosting aplikacji" },
              { k: "Neon", v: "baza danych (Postgres, region UE)" },
              { k: "Resend", v: "wysyłka wiadomości e-mail (linki logowania)" },
              { k: "Upstash", v: "limitowanie nadużyć (rate-limit)" },
              { k: "Google", v: "logowanie przez konto Google (OAuth)" },
            ]}
          />
          <p>
            Część dostawców może przetwarzać dane poza EOG — w takich przypadkach
            opieramy transfer na standardowych klauzulach umownych zatwierdzonych
            przez Komisję Europejską.
          </p>
        </Section>

        <Section id="retencja" title="Okres przechowywania">
          <ul className="space-y-2 list-disc pl-5 marker:text-muted-foreground/60">
            <li>Dane konta — przez czas posiadania konta.</li>
            <li>
              Oceny i opinie — do czasu ich usunięcia przez Ciebie lub usunięcia
              konta.
            </li>
            <li>
              Logi techniczne i dane anty-spamowe — przez okres niezbędny do
              zapewnienia bezpieczeństwa, zwykle do kilkunastu miesięcy.
            </li>
          </ul>
        </Section>

        <Section id="prawa" title="Twoje prawa">
          <p>Zgodnie z RODO przysługuje Ci prawo do:</p>
          <ul className="space-y-2 list-disc pl-5 marker:text-muted-foreground/60">
            <li>dostępu do danych i uzyskania ich kopii,</li>
            <li>sprostowania i usunięcia danych („prawo do bycia zapomnianym”),</li>
            <li>ograniczenia przetwarzania oraz sprzeciwu,</li>
            <li>przenoszenia danych,</li>
            <li>
              wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych
              (uodo.gov.pl).
            </li>
          </ul>
          <p>
            Większość praw zrealizujesz samodzielnie w panelu{" "}
            <a href="/profil" className="underline underline-offset-4 hover:text-foreground">
              „Mój profil”
            </a>{" "}
            — możesz tam pobrać kopię swoich danych oraz trwale usunąć konto.
          </p>
        </Section>

        <Section id="cookies" title="Pliki cookies">
          <p>
            Używamy wyłącznie cookies niezbędnych do działania serwisu: tokenu
            sesji utrzymującego zalogowanie oraz zapisu Twojej decyzji dotyczącej
            cookies. Nie stosujemy obecnie cookies marketingowych ani
            śledzących. W razie wprowadzenia narzędzi analitycznych poprosimy
            Cię o odrębną zgodę.
          </p>
        </Section>

        <Section id="kontakt" title="Kontakt">
          <p>
            W sprawach dotyczących prywatności napisz na{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4 hover:text-foreground">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>
      </div>
    </article>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="text-sm leading-relaxed text-foreground/85 space-y-3">
        {children}
      </div>
    </section>
  );
}

function Rules({ items }: { items: { k: string; v: string }[] }) {
  return (
    <dl className="grid gap-px overflow-hidden rounded-lg border border-border bg-border text-sm">
      {items.map((it) => (
        <div key={it.k} className="grid grid-cols-[200px_1fr] gap-4 bg-background p-3">
          <dt className="text-muted-foreground">{it.k}</dt>
          <dd className="text-foreground">{it.v}</dd>
        </div>
      ))}
    </dl>
  );
}
