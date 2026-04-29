import type { Metadata } from "next";
import { auth } from "@/auth";
import { CourseRequestForm } from "@/components/requests/CourseRequestForm";

export const metadata: Metadata = {
  title: "Dodaj kurs",
  description:
    "Brakuje kursu w katalogu coursed.pl? Zgłoś go redakcji — sprawdzimy i opublikujemy.",
};

export default async function CourseRequestPage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Dodaj kurs do katalogu</h1>
        <p className="text-muted-foreground">
          Nie znalazłeś kursu, którego szukasz? Wypełnij formularz — redakcja zweryfikuje
          zgłoszenie i doda kurs do katalogu, jeśli spełnia kryteria jakości.
        </p>
      </header>

      <CourseRequestForm defaultEmail={session?.user?.email ?? undefined} />

      <aside className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Co zwiększa szansę publikacji?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Pełny tytuł kursu wraz z autorem lub platformą.</li>
          <li>Bezpośredni link do strony kursu (nie strony głównej platformy).</li>
          <li>Krótki opis: dla kogo, czemu warto, język i format.</li>
        </ul>
      </aside>
    </div>
  );
}
