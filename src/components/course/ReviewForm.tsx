"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { addReview } from "@/server/actions/courses";
import { cn } from "@/lib/utils";

type Props = {
  courseId: string;
  initialBody: string | null;
  initialRating: number | null;
  isLoggedIn: boolean;
};

export function ReviewForm({ courseId, initialBody, initialRating, isLoggedIn }: Props) {
  const [body, setBody] = useState(initialBody ?? "");
  const [rating, setRating] = useState<number | null>(initialRating);
  const [hover, setHover] = useState<number | null>(null);
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
    if (!rating) {
      toast.error("Wybierz ocenę gwiazdkową.");
      return;
    }
    if (body.trim().length < 20) {
      toast.error("Opinia musi mieć min. 20 znaków.");
      return;
    }
    startTransition(async () => {
      const res = await addReview({ courseId, body: body.trim(), value: rating });
      if (!res.ok) {
        toast.error(res.error);
      } else {
        toast.success(initialBody ? "Opinia zaktualizowana." : "Opinia dodana.");
      }
    });
  };

  const display = hover ?? rating ?? 0;

  return (
    <div className="rounded-lg border border-border p-4 space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Twoja ocena *
        </Label>
        <div className="flex items-center gap-3">
          <div
            className={cn("flex gap-0.5", isPending && "opacity-60")}
            onMouseLeave={() => setHover(null)}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                disabled={isPending}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                aria-label={`Oceń ${n}/10`}
                className="rounded transition-transform hover:scale-110 disabled:cursor-wait"
              >
                <Star
                  className={cn(
                    "size-5 transition-colors",
                    n <= display ? "fill-primary text-primary" : "text-muted-foreground/40",
                  )}
                />
              </button>
            ))}
          </div>
          {rating !== null && (
            <span className="text-sm font-semibold tabular-nums">{rating}/10</span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="review-body" className="text-xs uppercase tracking-wide text-muted-foreground">
          {initialBody ? "Twoja opinia (edytuj)" : "Twoja opinia"}
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
    </div>
  );
}
