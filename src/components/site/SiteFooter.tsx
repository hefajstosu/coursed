import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 md:grid-cols-4 text-sm">
        <div>
          <div className="font-semibold mb-2">coursed.pl</div>
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
              <Link href="/kategoria/programowanie" className="hover:text-foreground">
                Programowanie
              </Link>
            </li>
            <li>
              <Link href="/kategoria/biznes" className="hover:text-foreground">
                Biznes
              </Link>
            </li>
            <li>
              <Link href="/kategoria/jezyki" className="hover:text-foreground">
                Języki
              </Link>
            </li>
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
                Zgłoś kurs
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Serwis</div>
          <ul className="space-y-1.5 text-muted-foreground">
            <li>O coursed.pl</li>
            <li>Polityka prywatności</li>
            <li>Regulamin</li>
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
