import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sprawdź email",
};

export default function CheckEmailPage() {
  return (
    <div className="w-full max-w-md space-y-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Sprawdź skrzynkę</h1>
      <p className="text-muted-foreground">
        Wysłaliśmy magic link na podany adres email. Kliknij w niego, aby się zalogować.
      </p>
      <p className="text-xs text-muted-foreground">
        Link może trafić do folderu „spam".
      </p>
      <Link href="/login" className="inline-block text-sm underline-offset-4 hover:underline">
        ← Wróć do logowania
      </Link>
    </div>
  );
}
