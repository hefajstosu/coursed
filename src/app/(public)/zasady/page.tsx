import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zasady opinii i moderacji",
  description:
    "Zasady wystawiania opinii i moderacji treści w serwisie coursed.pl.",
  alternates: { canonical: "/zasady" },
};

const TOC = [
  { id: "rodzaje", label: "Rodzaje opinii" },
  { id: "wymagania", label: "Wymagania techniczne" },
  { id: "usuwamy", label: "Co usuwamy lub ukrywamy" },
  { id: "krytyk", label: "Status zweryfikowanego krytyka" },
  { id: "zglaszanie", label: "Zgłaszanie naruszeń" },
  { id: "audyt", label: "Audyt zmian" },
  { id: "limity", label: "Limity nadużyć" },
  { id: "kontakt", label: "Kontakt" },
];

export default function ZasadyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-10 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Regulamin
        </p>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Zasady opinii i moderacji
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Reguły, którymi kierujemy się przy publikacji opinii oraz przy
          moderacji treści przez redakcję coursed.pl.
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
              <a
                href={`#${t.id}`}
                className="text-muted-foreground hover:text-foreground"
              >
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
        <Section id="rodzaje" title="Rodzaje opinii">
          <p>
            W serwisie wyróżniamy dwa typy opinii: <strong>opinie zwykłych użytkowników</strong>{" "}
            oraz <strong>opinie zweryfikowanych krytyków i redakcji</strong>. Każda opinia
            jest wyraźnie oznaczona, a ocena ogólna kursu to średnia 50/50 oceny
            użytkowników i krytyków.
          </p>
        </Section>

        <Section id="wymagania" title="Wymagania techniczne">
          <p>Opinia, by mogła zostać opublikowana, musi spełniać:</p>
          <Rules
            items={[
              { k: "Długość", v: "od 20 do 5000 znaków" },
              { k: "Skala oceny", v: "1–10 (liczbowa)" },
              { k: "Limit linków", v: "maks. 2 w treści opinii" },
              {
                k: "Wielkie litery",
                v: "maks. 60% liter dużych przy długości od 30 znaków",
              },
              {
                k: "Jeden użytkownik",
                v: "jedna opinia na kurs (kolejne aktualizują poprzednią)",
              },
              {
                k: "Duplikaty",
                v: "identyczna treść opinii pod więcej niż jednym kursem zostanie odrzucona",
              },
            ]}
          />
        </Section>

        <Section id="usuwamy" title="Co usuwamy lub ukrywamy">
          <ul className="space-y-2 list-disc pl-5 marker:text-muted-foreground/60">
            <li>Spam, treści promocyjne i kopiowane między kursami.</li>
            <li>Mowę nienawiści, obraźliwe ataki personalne, dyskryminację.</li>
            <li>Treści naruszające prawo lub dobra osobiste osób trzecich.</li>
            <li>
              Opinie wystawione w celu manipulacji oceną — fałszywe konta, oceny
              nieoparte na faktycznym kontakcie z kursem.
            </li>
            <li>Dane kontaktowe oraz prywatne dane osób trzecich.</li>
          </ul>
        </Section>

        <Section id="krytyk" title="Status zweryfikowanego krytyka">
          <p>
            Status krytyka nadaje wyłącznie redakcja coursed.pl po zweryfikowaniu
            kompetencji i niezależności osoby. Krytycy zobowiązują się do:
          </p>
          <ul className="space-y-2 list-disc pl-5 marker:text-muted-foreground/60">
            <li>ujawniania konfliktów interesów,</li>
            <li>oceniania kursów na podstawie własnego kontaktu z materiałem,</li>
            <li>kierowania się rzetelnością merytoryczną przy formułowaniu opinii.</li>
          </ul>
        </Section>

        <Section id="zglaszanie" title="Zgłaszanie naruszeń">
          <p>
            Każdy zalogowany użytkownik może zgłosić opinię naruszającą zasady,
            klikając przycisk <strong>„Zgłoś”</strong> przy treści. Zgłoszenia trafiają do
            kolejki moderacji i są rozpatrywane przez redakcję — opinia może
            zostać:
          </p>
          <Rules
            items={[
              { k: "Ukryta", v: "widoczna tylko dla autora i redakcji" },
              { k: "Usunięta", v: "trwałe usunięcie z katalogu" },
              {
                k: "Bez zmian",
                v: "zgłoszenie odrzucone wraz z uzasadnieniem",
              },
            ]}
          />
        </Section>

        <Section id="audyt" title="Audyt zmian">
          <p>
            Wszystkie działania moderacyjne — zmiana statusu opinii,
            rozstrzygnięcie zgłoszenia, edycja kursu, zmiana roli użytkownika —
            są rejestrowane w wewnętrznym dzienniku audytu wraz z autorem i
            czasem zdarzenia.
          </p>
        </Section>

        <Section id="limity" title="Limity nadużyć">
          <p>
            Aby ograniczyć spam i automatyczne ataki, działania użytkownika są
            limitowane czasowo:
          </p>
          <Rules
            items={[
              { k: "Oceny i opinie", v: "kilkanaście na godzinę" },
              { k: "Głosy pomocności", v: "kilkadziesiąt na godzinę" },
              { k: "Zgłoszenia", v: "kilka na dobę" },
            ]}
          />
        </Section>

        <Section id="kontakt" title="Kontakt">
          <p>
            Pytania dotyczące zasad lub konkretnych decyzji moderacyjnych można
            kierować do redakcji przez formularz kontaktowy.
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
        <div
          key={it.k}
          className="grid grid-cols-[180px_1fr] gap-4 bg-background p-3"
        >
          <dt className="text-muted-foreground">{it.k}</dt>
          <dd className="text-foreground">{it.v}</dd>
        </div>
      ))}
    </dl>
  );
}
