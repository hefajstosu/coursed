"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setReviewStatus, resolveReport } from "@/server/actions/admin/reviews";

const STATUS_LABEL: Record<string, string> = {
  VISIBLE: "Widoczna",
  HIDDEN: "Ukryta",
  REMOVED: "Usunięta",
};

export function ReviewStatusActions({
  reviewId,
  current,
}: {
  reviewId: string;
  current: "VISIBLE" | "HIDDEN" | "REMOVED";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onClick = (status: "VISIBLE" | "HIDDEN" | "REMOVED") =>
    startTransition(async () => {
      const res = await setReviewStatus({ reviewId, status });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(STATUS_LABEL[status]);
      router.refresh();
    });

  const buttons: Array<{ to: "VISIBLE" | "HIDDEN" | "REMOVED"; label: string; intent?: "danger" }> = [
    { to: "VISIBLE", label: "Pokaż" },
    { to: "HIDDEN", label: "Ukryj" },
    { to: "REMOVED", label: "Usuń", intent: "danger" },
  ];

  return (
    <div className="flex gap-1">
      {buttons.map((b) => {
        const active = b.to === current;
        return (
          <button
            key={b.to}
            type="button"
            disabled={isPending || active}
            onClick={() => onClick(b.to)}
            className={`rounded-md border px-2 py-1 text-xs transition-colors disabled:opacity-50 ${
              active
                ? "border-foreground bg-foreground text-background cursor-default"
                : b.intent === "danger"
                  ? "border-input text-destructive hover:bg-destructive/10"
                  : "border-input hover:bg-muted"
            }`}
          >
            {b.label}
          </button>
        );
      })}
    </div>
  );
}

export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const decide = (status: "RESOLVED" | "REJECTED") =>
    startTransition(async () => {
      const res = await resolveReport({ reportId, status });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(status === "RESOLVED" ? "Rozwiązane." : "Odrzucone.");
      router.refresh();
    });

  return (
    <div className="flex gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() => decide("RESOLVED")}
        className="rounded-md border border-input px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
      >
        Rozwiąż
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => decide("REJECTED")}
        className="rounded-md border border-input px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
      >
        Odrzuć
      </button>
    </div>
  );
}
