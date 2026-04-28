"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { rateCourse } from "@/server/actions/courses";
import { cn } from "@/lib/utils";

type Props = {
  courseId: string;
  initialValue: number | null;
  isLoggedIn: boolean;
};

export function RatingForm({ courseId, initialValue, isLoggedIn }: Props) {
  const [value, setValue] = useState<number | null>(initialValue);
  const [hover, setHover] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const display = hover ?? value ?? 0;

  const submit = (next: number) => {
    if (!isLoggedIn) {
      toast.error("Zaloguj się, aby ocenić kurs.");
      return;
    }
    setValue(next);
    startTransition(async () => {
      const res = await rateCourse({ courseId, value: next });
      if (!res.ok) {
        toast.error(res.error);
        setValue(initialValue);
      } else {
        toast.success(initialValue === null ? "Ocena zapisana." : "Ocena zaktualizowana.");
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {value === null ? "Twoja ocena" : "Twoja ocena (kliknij, aby zmienić)"}
        </span>
        {value !== null && (
          <span className="text-sm font-semibold tabular-nums">{value}/10</span>
        )}
      </div>
      <div
        className={cn("flex gap-0.5", isPending && "opacity-60")}
        onMouseLeave={() => setHover(null)}
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            disabled={isPending}
            onClick={() => submit(n)}
            onMouseEnter={() => setHover(n)}
            aria-label={`Oceń ${n}/10`}
            className="rounded transition-transform hover:scale-110 disabled:cursor-wait"
          >
            <Star
              className={cn(
                "size-5 transition-colors",
                n <= display
                  ? "fill-primary text-primary"
                  : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
      {!isLoggedIn && (
        <p className="text-xs text-muted-foreground">
          <a href="/login" className="underline-offset-4 hover:underline">
            Zaloguj się
          </a>
          , aby wystawić ocenę.
        </p>
      )}
    </div>
  );
}
