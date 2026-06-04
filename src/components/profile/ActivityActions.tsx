"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteOwnRating, deleteOwnReview } from "@/server/actions/courses";

export function DeleteRatingButton({ courseId }: { courseId: string }) {
  const [isPending, start] = useTransition();
  const onClick = () => {
    if (!confirm("Usunąć ocenę tego kursu? Opinia (jeśli istnieje) pozostanie.")) return;
    start(async () => {
      const res = await deleteOwnRating({ courseId });
      if (res.ok) toast.success("Ocena usunięta.");
      else toast.error(res.error);
    });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline disabled:opacity-50"
    >
      {isPending ? "Usuwam…" : "Usuń ocenę"}
    </button>
  );
}

export function DeleteReviewButton({ reviewId }: { reviewId: string }) {
  const [isPending, start] = useTransition();
  const onClick = () => {
    if (!confirm("Usunąć tę opinię? Operacji nie można cofnąć.")) return;
    start(async () => {
      const res = await deleteOwnReview({ reviewId });
      if (res.ok) toast.success("Opinia usunięta.");
      else toast.error(res.error);
    });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline disabled:opacity-50"
    >
      {isPending ? "Usuwam…" : "Usuń opinię"}
    </button>
  );
}
