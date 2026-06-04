"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "coursed-cookie-consent";

/**
 * Baner zgody na cookies. Obecnie serwis używa wyłącznie cookies niezbędnych
 * (token sesji + zapis tej decyzji), więc baner ma charakter informacyjny.
 * Po dodaniu narzędzi analitycznych należy rozbudować o zgodę opcjonalną.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // setState poza synchronicznym ciałem efektu (rAF) — czytamy localStorage
    // dopiero po montażu, unikając cascading renders i flashu przy SSR.
    const id = requestAnimationFrame(() => {
      try {
        if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
      } catch {
        // brak dostępu do localStorage — nie pokazuj banera
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // ignoruj
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Informacja o plikach cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          Używamy wyłącznie cookies niezbędnych do działania serwisu (logowanie i
          zapis tej decyzji). Szczegóły w{" "}
          <Link
            href="/polityka-prywatnosci"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Polityce prywatności
          </Link>
          .
        </p>
        <Button onClick={accept} size="sm" className="shrink-0 self-end sm:self-auto">
          Rozumiem
        </Button>
      </div>
    </div>
  );
}
