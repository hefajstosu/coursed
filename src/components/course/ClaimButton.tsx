"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitCourseClaim } from "@/server/actions/claim";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/** #15 Zgłoszenie przejęcia listingu kursu przez twórcę/platformę. */
export function ClaimButton({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [note, setNote] = useState("");
  const [isPending, start] = useTransition();

  if (done) {
    return (
      <p className="text-xs text-muted-foreground">
        Zgłoszenie przejęcia wysłane — czeka na weryfikację redakcji.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        To Twój kurs? Zgłoś przejęcie listingu
      </button>
    );
  }

  const submit = () =>
    start(async () => {
      const res = await submitCourseClaim({ courseId, note: note.trim() || undefined });
      if (!res.ok) {
        toast.error(res.error ?? "Błąd");
        return;
      }
      setDone(true);
      toast.success("Zgłoszenie wysłane.");
    });

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <p className="text-xs text-muted-foreground">
        Jesteś autorem kursu lub przedstawicielem platformy? Opisz powiązanie — redakcja
        zweryfikuje zgłoszenie, a po zatwierdzeniu będziesz mógł odpowiadać na opinie.
      </p>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Np. link do Twojej strony, dowód powiązania z kursem…"
        disabled={isPending}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={isPending}>
          Wyślij zgłoszenie
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
          Anuluj
        </Button>
      </div>
    </div>
  );
}
