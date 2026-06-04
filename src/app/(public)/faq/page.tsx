import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Najczęstsze pytania",
  description:
    "Odpowiedzi na najczęstsze pytania dotyczące coursed.pl — opinii, ocen, zgłaszania kursów i moderacji.",
  alternates: { canonical: "/faq" },
};

type Faq = { q: string; a: string };

const SECTIONS: { title: string; items: Faq[] }[] = [
  {
    title: "O serwisie",
    items: [
      {
        q: "Czym jest coursed.pl?",
        a: "Niezależny portal opinii o kursach online i offline. Zbieramy oceny i opinie zarówno od zwykłych użytkowników, jak i od zweryfikowanych krytyków, a ocena ogólna kursu to średnia 50/50 obu źródeł w skali 1–10.",
      },
      {
        q: "Czy serwis jest powiązany z konkretnymi platformami kursów?",
        a: "Nie. coursed.pl jest niezależny — nie pobieramy prowizji za kierowanie ruchu i nie przyjmujemy płatności za podwyższanie pozycji w rankingach. Linki zewnętrzne mogą być oznaczane jako sponsorowane, jeśli takie są.",
      },
      {
        q: "Czy korzystanie z serwisu jest darmowe?",
        a: "Tak. Przeglądanie kursów, opinii i ocen nie wymaga konta. Dodawanie własnej opinii lub oceny wymaga zalogowania się.",
      },
    ],
  },
  {
    title: "Konto i logowanie",
    items: [
      {
        q: "Jak założyć konto?",
        a: "Konto zakładasz przez logowanie zewnętrznym providerem (np. Google) — nie przechowujemy haseł. Po pierwszym logowaniu Twoje konto powstaje automatycznie.",
      },
      {
        q: "Jak zostać zweryfikowanym krytykiem?",
        a: "Status krytyka nadaje wyłącznie redakcja po ocenie kompetencji i niezależności osoby. Zgłoszenia kierujemy przez formularz kontaktowy — szczegóły opisaliśmy na stronie /zasady.",
      },
      {
        q: "Jak usunąć konto?",
        a: "W tej chwili usunięcie konta wykonujemy ręcznie po zgłoszeniu mailowym do redakcji. Pracujemy nad samoobsługowym kasowaniem konta.",
      },
    ],
  },
  {
    title: "Opinie i oceny",
    items: [
      {
        q: "Kto może wystawić opinię?",
        a: "Każdy zalogowany użytkownik. Jeden użytkownik = jedna opinia na kurs — kolejne wpisy aktualizują poprzedni. Opinia musi mieć od 20 do 5000 znaków i ocenę 1–10.",
      },
      {
        q: "Jak wyliczana jest ocena ogólna kursu?",
        a: "Średnia 50/50 dwóch źródeł: ocen zwykłych użytkowników i ocen zweryfikowanych krytyków/redakcji. Obie składowe widać osobno na karcie kursu, więc widzisz, jak rozkłada się odbiór.",
      },
      {
        q: "Dlaczego moja opinia została odrzucona lub ukryta?",
        a: "Najczęstsze powody: zbyt krótka treść, zbyt dużo wielkich liter, więcej niż 2 linki, identyczna treść wklejona przy innym kursie, lub zgłoszenie naruszenia regulaminu rozpatrzone na korzyść zgłoszenia. Pełna lista — /zasady.",
      },
      {
        q: "Czy mogę edytować swoją opinię?",
        a: "Tak. Wejdź na stronę kursu — formularz opinii automatycznie wczyta Twoją obecną treść i ocenę do edycji. Najnowsza wersja zastępuje poprzednią.",
      },
    ],
  },
  {
    title: "Zgłaszanie kursu",
    items: [
      {
        q: "Mam kurs — jak go dodać do katalogu?",
        a: "Wypełnij formularz na stronie /zglos-kurs. Zgłoszenie trafia do moderacji — redakcja sprawdza zgodność z polityką katalogu i decyduje o publikacji w ciągu kilku dni roboczych.",
      },
      {
        q: "Kto może zgłosić kurs?",
        a: "Zarówno autorzy/organizatorzy kursów, jak i uczestnicy, którzy chcą dodać brakującą pozycję do katalogu. Kursy duplikujące istniejące pozycje są scalane.",
      },
    ],
  },
  {
    title: "Moderacja i bezpieczeństwo",
    items: [
      {
        q: "Jak zgłosić nieprawidłową opinię?",
        a: "Każda opinia ma przycisk „Zgłoś” widoczny dla zalogowanych użytkowników. Zgłoszenia trafiają do kolejki moderacji rozpatrywanej przez redakcję.",
      },
      {
        q: "Czy zgłoszenia są anonimowe?",
        a: "Redakcja widzi, kto wystawił zgłoszenie (do celów ograniczania nadużyć), ale autor zgłaszanej opinii nie widzi tożsamości zgłaszającego.",
      },
      {
        q: "Czy decyzje moderacyjne są audytowalne?",
        a: "Tak. Każda zmiana statusu opinii, rozstrzygnięcie zgłoszenia, edycja kursu czy zmiana roli użytkownika jest rejestrowana w wewnętrznym dzienniku audytu.",
      },
    ],
  },
];

const ALL_FAQS = SECTIONS.flatMap((s) => s.items);

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ALL_FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Najczęstsze pytania
        </h1>
        <p className="text-sm text-muted-foreground">
          Krótkie odpowiedzi na pytania o coursed.pl, opinie, oceny i moderację.
          Dłuższe regulacje — zob. <a href="/zasady" className="underline-offset-4 hover:text-foreground hover:underline">zasady opinii</a>.
        </p>
      </header>

      {SECTIONS.map((s) => (
        <section key={s.title} className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">{s.title}</h2>
          <div className="divide-y divide-border rounded-lg border border-border">
            {s.items.map((f) => (
              <details key={f.q} className="group p-4">
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium marker:hidden [&::-webkit-details-marker]:hidden">
                  <span>{f.q}</span>
                  <span className="text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </article>
  );
}
