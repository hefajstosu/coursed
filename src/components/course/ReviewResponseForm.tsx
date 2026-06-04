"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  upsertReviewResponse,
  deleteReviewResponse,
} from "@/server/actions/admin/reviews";

/** #8 Edycja odpowiedzi redakcji — widoczna tylko dla EDITOR/ADMIN. */
export function ReviewResponseForm({
  reviewId,
  initialBody,
}: {
  reviewId: string;
  initialBody: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(initialBody ?? "");
  const [isPending, start] = useTransition();

  const save = () =>
    start(async () => {
      const res = await upsertReviewResponse({ reviewId, body: body.trim() });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Odpowiedź zapisana.");
      setOpen(false);
      router.refresh();
    });

  const remove = () =>
    start(async () => {
      const res = await deleteReviewResponse({ reviewId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Odpowiedź usunięta.");
      setBody("");
      setOpen(false);
      router.refresh();
    });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {initialBody ? "Edytuj odpowiedź redakcji" : "Odpowiedz jako redakcja"}
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Odpowiedź redakcji / platformy…"
        rows={3}
        disabled={isPending}
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={save} disabled={isPending || body.trim().length === 0}>
          Zapisz
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
          Anuluj
        </Button>
        {initialBody && (
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            className="ml-auto text-xs text-destructive underline-offset-4 hover:underline disabled:opacity-50"
          >
            Usuń odpowiedź
          </button>
        )}
      </div>
    </div>
  );
}
