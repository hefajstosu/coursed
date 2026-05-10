import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zasady opinii i moderacji",
  description:
    "Zasady wystawiania opinii i moderacji treści w serwisie coursed.pl.",
  alternates: { canonical: "/zasady" },
};

export default function ZasadyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 prose prose-zinc dark:prose-invert">
      <header className="not-prose mb-8 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Zasady opinii i moderacji
        </h1>
        <p className="text-sm text-muted-foreground">
          Reguły, którymi kierujemy się przy publikacji opinii oraz przy
          moderacji treści przez redakcję coursed.pl.
        </p>
      </header>

      <h2>Rodzaje opinii</h2>
      <p>
        W serwisie wyróżniamy dwa typy opinii: opinie zwykłych użytkowników
        oraz opinie zweryfikowanych krytyków i redakcji. Każda opinia jest
        wyraźnie oznaczona, a ocena ogólna kursu to średnia 50/50 oceny
        użytkowników i krytyków.
      </p>

      <h2>Wymagania techniczne</h2>
      <ul>
        <li>Minimalna długość treści opinii: 20 znaków.</li>
        <li>Maksymalna długość: 5000 znaków.</li>
        <li>Skala oceny: 1–10 (liczbowa).</li>
        <li>Maksymalnie 2 linki w treści opinii.</li>
        <li>
          Treść nie może być zdominowana wielkimi literami (limit 60% liter
          dużych przy długości od 30 znaków).
        </li>
        <li>
          Jeden użytkownik = jedna opinia na kurs (kolejne wpisy aktualizują
          poprzedni).
        </li>
        <li>
          Identyczna treść opinii wklejona przy więcej niż jednym kursie
          zostanie odrzucona.
        </li>
      </ul>

      <h2>Co usuwamy lub ukrywamy</h2>
      <ul>
        <li>Spam, treści promocyjne i kopiowane między kursami.</li>
        <li>Mowę nienawiści, obraźliwe ataki personalne, dyskryminację.</li>
        <li>Treści naruszające prawo lub dobra osobiste osób trzecich.</li>
        <li>
          Opinie wystawione w celu manipulacji oceną (fałszywe konta, oceny
          nieoparte na faktycznym kontakcie z kursem).
        </li>
        <li>Dane kontaktowe, prywatne dane osób trzecich.</li>
      </ul>

      <h2>Status zweryfikowanego krytyka</h2>
      <p>
        Status krytyka nadaje wyłącznie redakcja coursed.pl po zweryfikowaniu
        kompetencji i niezależności osoby. Krytycy zobowiązują się do
        ujawniania konfliktów interesów oraz do oceniania kursów na podstawie
        własnego kontaktu z materiałem.
      </p>

      <h2>Zgłaszanie naruszeń</h2>
      <p>
        Każdy zalogowany użytkownik może zgłosić opinię naruszającą zasady,
        klikając przycisk „Zgłoś" przy treści. Zgłoszenia trafiają do kolejki
        moderacji i są rozpatrywane przez redakcję — opinia może zostać
        ukryta, usunięta lub pozostać bez zmian wraz z uzasadnieniem
        odrzucenia zgłoszenia.
      </p>

      <h2>Audyt zmian</h2>
      <p>
        Wszystkie działania moderacyjne (zmiana statusu opinii, rozstrzygnięcie
        zgłoszenia, edycja kursu, zmiana roli użytkownika) są rejestrowane w
        wewnętrznym dzienniku audytu wraz z autorem i czasem zdarzenia.
      </p>

      <h2>Limity nadużyć</h2>
      <p>
        Aby ograniczyć spam i automatyczne ataki, działania użytkownika są
        limitowane czasowo: oceny i opinie do kilkunastu na godzinę, głosy
        pomocności do kilkudziesięciu na godzinę, zgłoszenia do kilku na dobę.
      </p>

      <h2>Kontakt</h2>
      <p>
        Pytania dotyczące zasad lub konkretnych decyzji moderacyjnych można
        kierować do redakcji przez formularz kontaktowy.
      </p>
    </article>
  );
}
