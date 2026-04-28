import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
          <Link href="/" className="inline-flex" aria-label="coursed.pl">
            <Image
              src="/logo.png"
              alt="coursed.pl"
              width={140}
              height={26}
              priority
              className="h-6 w-auto dark:invert"
            />
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">{children}</main>
    </div>
  );
}
