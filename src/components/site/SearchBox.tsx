"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type Hit = { slug: string; title: string; platformName: string | null };

/** #17 Pole wyszukiwania z podpowiedziami (autocomplete). */
export function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      if (q.trim().length < 2) {
        setHits([]);
        setOpen(false);
        return;
      }
      try {
        const r = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (r.ok) {
          setHits(await r.json());
          setOpen(true);
          setActive(-1);
        }
      } catch {
        // abort/ignore
      }
    }, 150);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const goSearch = () => {
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    router.push(`/szukaj?q=${encodeURIComponent(term)}`);
  };

  const goCourse = (slug: string) => {
    setOpen(false);
    setQ("");
    router.push(`/kursy/${slug}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || hits.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      goCourse(hits[active].slug);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="relative hidden w-full max-w-xs flex-1 md:block">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          goSearch();
        }}
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
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => hits.length > 0 && setOpen(true)}
            placeholder="Szukaj kursów…"
            className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </form>

      {open && hits.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
          {hits.map((h, i) => (
            <li key={h.slug}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => goCourse(h.slug)}
                className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm ${
                  i === active ? "bg-muted" : "hover:bg-muted"
                }`}
              >
                <span className="truncate font-medium">{h.title}</span>
                {h.platformName && (
                  <span className="truncate text-xs text-muted-foreground">{h.platformName}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
