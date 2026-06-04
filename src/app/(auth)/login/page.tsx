import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  signInWithGoogle,
  signInWithMagicLink,
  devSignInAs,
} from "@/server/actions/auth";

export const metadata: Metadata = {
  title: "Zaloguj się",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNextPath =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const session = await auth();
  if (session?.user) redirect(safeNextPath);

  const isDev = process.env.NODE_ENV === "development";
  const hasGoogle = !!process.env.AUTH_GOOGLE_ID;
  const hasResend = !!process.env.AUTH_RESEND_KEY;

  const devUsers = isDev
    ? await db.user.findMany({
        select: { email: true, name: true, role: true },
        orderBy: { role: "asc" },
      })
    : [];

  return (
    <div className="w-full max-w-md space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Zaloguj się do coursed.pl</h1>
        <p className="text-sm text-muted-foreground">
          Po zalogowaniu możesz oceniać kursy i dodawać opinie.
        </p>
      </header>

      <div className="space-y-4 rounded-lg border border-border bg-card p-6">
        {hasGoogle ? (
          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={safeNextPath} />
            <Button type="submit" variant="outline" className="w-full">
              Zaloguj z Google
            </Button>
          </form>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            Google (skonfiguruj AUTH_GOOGLE_ID)
          </Button>
        )}

        <Separator>lub</Separator>

        <form action={signInWithMagicLink} className="space-y-3">
          <input type="hidden" name="next" value={safeNextPath} />
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="ty@example.com"
              required
              disabled={!hasResend}
            />
          </div>
          <Button type="submit" className="w-full" disabled={!hasResend}>
            {hasResend ? "Wyślij magic link" : "Magic link (skonfiguruj AUTH_RESEND_KEY)"}
          </Button>
        </form>
      </div>

      {isDev && devUsers.length > 0 && (
        <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Tryb deweloperski — szybkie logowanie
          </div>
          <div className="space-y-2">
            {devUsers.map((u) => (
              <form key={u.email} action={devSignInAs}>
                <input type="hidden" name="email" value={u.email} />
                <button
                  type="submit"
                  className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
                >
                  <span className="font-medium">{u.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {u.email} · {u.role}
                  </span>
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Separator({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
      <div className="h-px flex-1 bg-border" />
      <span>{children}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
