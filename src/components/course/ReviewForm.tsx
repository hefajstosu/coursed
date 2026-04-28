"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { addReview } from "@/server/actions/courses";

type Props = {
  courseId: string;
  initialBody: string | null;
  isLoggedIn: boolean;
};

export function ReviewForm({ courseId, initialBody, isLoggedIn }: Props) {
  const [body, setBody] = useState(initialBody ?? "");
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(initialBody !== null);

  if (!isLoggedIn) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        <a href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Zaloguj się
        </a>
        , aby dodać opinię.
      </div>
    );
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="w-full">
        Dodaj opinię
      </Button>
    );
  }

  const submit = () => {
    if (body.trim().length < 20) {
      toast.error("Opinia musi mieć min. 20 znaków.");
      return;
    }
    startTransition(async () => {
      const res = await addReview({ courseId, body: body.trim() });
      if (!res.ok) {
        toast.error(res.error);
      } else {
        toast.success(initialBody ? "Opinia zaktualizowana." : "Opinia dodana.");
      }
    });
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="review-body" className="text-xs uppercase tracking-wide text-muted-foreground">
        {initialBody ? "Twoja opinia (edytuj)" : "Dodaj opinię"}
      </Label>
      <Textarea
        id="review-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Co Ci się podobało, a co warto poprawić?"
        rows={4}
        disabled={isPending}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground tabular-nums">{body.length}/5000</span>
        <Button onClick={submit} disabled={isPending} size="sm">
          {isPending ? "Zapisuję…" : initialBody ? "Zaktualizuj" : "Opublikuj"}
        </Button>
      </div>
    </div>
  );
}
