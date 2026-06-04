import type { Metadata } from "next";

// UWAGA: rzetelny szablon regulaminu — przed publikacją uzupełnij dane operatora
// ([NAZWA/ADRES/EMAIL]) i zweryfikuj u prawnika. Placeholdery w nawiasach [ ].

export const metadata: Metadata = {
  title: "Regulamin",
  description:
    "Regulamin świadczenia usług serwisu coursed.pl — zasady korzystania, konta, treści i reklamacje.",
  alternates: { canonical: "/regulamin" },
};

const CONTACT_EMAIL = "kontakt@coursed.pl";

const TOC = [
  { id: "definicje", label: "Definicje" },
  { id: "usluga", label: "Zakres usługi" },
  { id: "konto", label: "Konto użytkownika" },
  { id: "tresci", label: "Treści użytkowników" },
  { id: "odpowiedzialnosc", label: "Odpowiedzialność" },
  { id: "reklamacje", label: "Reklamacje" },
  { id: "odstapienie", label: "Rozwiązanie umowy" },
  { id: "zmiany", label: "Zmiany regulaminu" },
  { id: "koncowe", label: "Postanowienia końcowe" },
];

export default function RegulaminPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-10 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Dokument prawny
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Regulamin serwisu
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Zasady świadczenia usług drogą elektroniczną w serwisie coursed.pl.
          Korzystając z serwisu, akceptujesz poniższe warunki.
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
        <Section id="definicje" title="§1. Definicje">
          <ul className="space-y-2 list-disc pl-5 marker:text-muted-foreground/60">
            <li>
              <strong>Serwis</strong> — platforma internetowa coursed.pl
              umożliwiająca przeglądanie kursów oraz publikację ocen i opinii.
            </li>
            <li>
              <strong>Operator</strong> — [NAZWA OPERATORA], [ADRES], NIP [NIP].
            </li>
            <li>
              <strong>Użytkownik</strong> — osoba korzystająca z Serwisu,
              posiadająca lub nieposiadająca konta.
            </li>
            <li>
              <strong>Treści</strong> — oceny, opinie, głosy i zgłoszenia
              publikowane przez Użytkownika.
            </li>
          </ul>
        </Section>

        <Section id="usluga" title="§2. Zakres usługi">
          <p>
            Serwis jest niezależnym agregatorem opinii o kursach online i
            stacjonarnych. Operator nie jest sprzedawcą ani organizatorem
            kursów prezentowanych w katalogu i nie pośredniczy w ich zakupie.
            Korzystanie z Serwisu jest bezpłatne.
          </p>
        </Section>

        <Section id="konto" title="§3. Konto użytkownika">
          <ul className="space-y-2 list-disc pl-5 marker:text-muted-foreground/60">
            <li>
              Założenie konta następuje przez logowanie kontem Google lub przez
              link wysyłany na adres e-mail (logowanie bez hasła).
            </li>
            <li>Konto może założyć osoba, która ukończyła 16 lat.</li>
            <li>
              Użytkownik zobowiązuje się podawać prawdziwe dane i nie udostępniać
              dostępu do konta osobom trzecim.
            </li>
            <li>
              Użytkownik może w każdej chwili usunąć konto w panelu{" "}
              <a href="/profil" className="underline underline-offset-4 hover:text-foreground">
                „Mój profil”
              </a>
              .
            </li>
          </ul>
        </Section>

        <Section id="tresci" title="§4. Treści użytkowników">
          <p>
            Publikując Treści, Użytkownik oświadcza, że są one zgodne z prawem i
            ze stanem faktycznym oraz że przysługują mu do nich prawa.
            Szczegółowe wymagania i zasady moderacji określa dokument{" "}
            <a href="/zasady" className="underline underline-offset-4 hover:text-foreground">
              Zasady opinii i moderacji
            </a>
            . Zabronione jest publikowanie spamu, treści bezprawnych,
            obraźliwych oraz manipulujących oceną kursów.
          </p>
          <p>
            Użytkownik udziela Operatorowi niewyłącznej, nieodpłatnej licencji na
            publikację wystawionych Treści w Serwisie oraz w materiałach
            promujących Serwis (np. widget oceny). Licencja wygasa z chwilą
            usunięcia Treści lub konta.
          </p>
        </Section>

        <Section id="odpowiedzialnosc" title="§5. Odpowiedzialność">
          <p>
            Opinie publikowane w Serwisie są subiektywnymi wypowiedziami
            Użytkowników. Operator dokłada starań, by katalog był rzetelny, lecz
            nie gwarantuje kompletności ani aktualności danych o kursach.
            Operator nie ponosi odpowiedzialności za decyzje zakupowe podjęte na
            podstawie Treści.
          </p>
        </Section>

        <Section id="reklamacje" title="§6. Reklamacje">
          <p>
            Reklamacje dotyczące działania Serwisu można zgłaszać na adres{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4 hover:text-foreground">
              {CONTACT_EMAIL}
            </a>
            . Operator rozpatruje reklamacje w terminie 14 dni.
          </p>
        </Section>

        <Section id="odstapienie" title="§7. Rozwiązanie umowy">
          <p>
            Umowa o korzystanie z Serwisu zawierana jest na czas nieoznaczony i
            może zostać rozwiązana przez Użytkownika w każdej chwili poprzez
            usunięcie konta. Operator może zawiesić lub usunąć konto naruszające
            regulamin, informując o tym Użytkownika.
          </p>
        </Section>

        <Section id="zmiany" title="§8. Zmiany regulaminu">
          <p>
            Operator może zmienić regulamin z ważnych przyczyn (zmiana przepisów,
            zakresu usług, względy bezpieczeństwa). O zmianach poinformujemy z
            wyprzedzeniem. Dalsze korzystanie z Serwisu po wejściu zmian w życie
            oznacza ich akceptację.
          </p>
        </Section>

        <Section id="koncowe" title="§9. Postanowienia końcowe">
          <p>
            W sprawach nieuregulowanych stosuje się prawo polskie. Zasady
            przetwarzania danych osobowych opisuje{" "}
            <a href="/polityka-prywatnosci" className="underline underline-offset-4 hover:text-foreground">
              Polityka prywatności
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
