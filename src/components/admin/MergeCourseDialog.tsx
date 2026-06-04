"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mergeCourses } from "@/server/actions/admin/merge";

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  status: string;
};

export function MergeCourseDialog({
  sourceId,
  sourceTitle,
}: {
  sourceId: string;
  sourceTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [target, setTarget] = useState<SearchResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      if (q.trim().length < 2) {
        setResults([]);
        return;
      }
      try {
        const r = await fetch(`/admin/kursy/szukaj?q=${encodeURIComponent(q)}&exclude=${sourceId}`, {
          signal: ctrl.signal,
        });
        if (r.ok) setResults(await r.json());
      } catch {
        // abort
      }
    }, 200);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q, open, sourceId]);

  const submit = () => {
    if (!target) return;
    if (!confirm(`Scalić „${sourceTitle}" w „${target.title}"? Operacja przesunie oceny i opinie.`)) return;
    startTransition(async () => {
      const res = await mergeCourses({ sourceId, targetId: target.id });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Scalone. Stary slug przekierowuje teraz na docelowy kurs.");
      setOpen(false);
      router.push(`/admin/kursy/${target.id}`);
    });
  };

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Scal w inny kurs…
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 space-y-4 shadow-lg">
        <header>
          <h3 className="text-lg font-semibold">Scal kurs w inny</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Wybierz kurs docelowy. Oceny i opinie z „{sourceTitle}” zostaną przeniesione (konflikty
            unique courseId+userId są pomijane). Stary slug zacznie przekierowywać 301 na nowy.
          </p>
        </header>

        <div className="space-y-1.5">
          <Label htmlFor="merge-q" className="text-sm">
            Kurs docelowy
          </Label>
          <Input
            id="merge-q"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setTarget(null);
            }}
            placeholder="Wpisz tytuł lub slug…"
            autoComplete="off"
          />
        </div>

        {target ? (
          <div className="rounded-md border border-foreground/30 bg-muted p-3 text-sm">
            Docelowy: <span className="font-semibold">{target.title}</span>{" "}
            <span className="text-muted-foreground font-mono text-xs">/{target.slug}</span>
            <button
              type="button"
              className="ml-3 text-xs underline-offset-4 hover:underline"
              onClick={() => setTarget(null)}
            >
              zmień
            </button>
          </div>
        ) : (
          q.length >= 2 &&
          results.length > 0 && (
            <ul className="rounded-md border border-border max-h-60 overflow-y-auto divide-y divide-border">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setTarget(r)}
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                  >
                    <div className="font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">/{r.slug} · {r.status}</div>
                  </button>
                </li>
              ))}
            </ul>
          )
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Anuluj
          </Button>
          <Button type="button" onClick={submit} disabled={!target || isPending}>
            {isPending ? "Scalam…" : "Scal"}
          </Button>
        </div>
      </div>
    </div>
  );
}
