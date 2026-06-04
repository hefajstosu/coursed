import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logOut } from "@/server/actions/auth";
import { SearchBox } from "@/components/site/SearchBox";

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

        <SearchBox />

        <div className="flex items-center gap-2">
          {session?.user ? (
            <div className="flex items-center gap-3 text-sm">
              <Link
                href="/profil"
                className="hidden sm:inline text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {session.user.name ?? session.user.email}
              </Link>
              {(session.user.role === "ADMIN" || session.user.role === "EDITOR") && (
                <Link
                  href="/admin"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Panel
                </Link>
              )}
              <form action={logOut}>
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                >
                  Wyloguj
                </button>
              </form>
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
