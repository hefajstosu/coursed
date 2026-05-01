import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center" aria-label="coursed.pl">
            <Image
              src="/logo.png"
              alt="coursed.pl"
              width={214}
              height={40}
              priority
              className="h-9 w-auto dark:invert"
            />
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
            <Link href="/kursy" className="hover:text-foreground transition-colors">
              Kursy
            </Link>
            <Link href="/kategorie" className="hover:text-foreground transition-colors">
              Kategorie
            </Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">
              Blog
            </Link>
            <Link href="/zglos-kurs" className="hover:text-foreground transition-colors">
              Dodaj kurs
            </Link>
          </nav>
        </div>

        <form
          action="/szukaj"
          role="search"
          className="hidden flex-1 max-w-xs items-center md:flex"
        >
          <label htmlFor="site-search" className="sr-only">
            Szukaj kursów
          </label>
          <div className="relative w-full">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="site-search"
              type="search"
              name="q"
              placeholder="Szukaj kursów…"
              className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden sm:inline text-muted-foreground">
                {session.user.name ?? session.user.email}
              </span>
              {(session.user.role === "ADMIN" || session.user.role === "EDITOR") && (
                <Link
                  href="/admin"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Panel
                </Link>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Zaloguj się
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
