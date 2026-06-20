import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";

// Ile kategorii pokazać w stopce (jeśli jest mniej, pokaże tyle, ile jest).
const FOOTER_CATEGORIES = 4;

export async function SiteFooter() {
  // #stopka: kategorie dobierane dynamicznie (najpierw te z największą liczbą
  // kursów), zamiast sztywno wpisanych slugów.
  const categories = await db.category.findMany({
    where: { parentId: null },
    orderBy: [{ courses: { _count: "desc" } }, { name: "asc" }],
    take: FOOTER_CATEGORIES,
    select: { slug: true, name: true },
  });

  return (
    <footer className="mt-16 border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 md:grid-cols-4 text-sm">
        <div>
          <Image
            src="/logo.png"
            alt="coursed.pl"
            width={214}
            height={40}
            className="h-8 w-auto mb-3 dark:invert"
          />
          <p className="text-muted-foreground">
            Niezależny portal opinii o kursach online i offline.
          </p>
        </div>
        <div>
          <div className="font-semibold mb-2">Katalog</div>
          <ul className="space-y-1.5 text-muted-foreground">
            <li>
              <Link href="/kursy" className="hover:text-foreground">
                Wszystkie kursy
              </Link>
            </li>
            <li>
              <Link href="/kategorie" className="hover:text-foreground">
                Kategorie
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/kategoria/${c.slug}`} className="hover:text-foreground">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Społeczność</div>
          <ul className="space-y-1.5 text-muted-foreground">
            <li>
              <Link href="/blog" className="hover:text-foreground">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/zglos-kurs" className="hover:text-foreground">
                Dodaj kurs
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Serwis</div>
          <ul className="space-y-1.5 text-muted-foreground">
            <li>
              <Link href="/regulamin" className="hover:text-foreground">
                Regulamin
              </Link>
            </li>
            <li>
              <Link href="/polityka-prywatnosci" className="hover:text-foreground">
                Polityka prywatności
              </Link>
            </li>
            <li>
              <Link href="/zasady" className="hover:text-foreground">
                Zasady opinii
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-foreground">
                FAQ
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} coursed.pl
        </div>
      </div>
    </footer>
  );
}
