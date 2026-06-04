"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveCourseClaim, rejectCourseClaim } from "@/server/actions/admin/claims";

export function ClaimActions({ claimId }: { claimId: string }) {
  const router = useRouter();
  const [isPending, start] = useTransition();

  const decide = (action: "approve" | "reject") =>
    start(async () => {
      const res =
        action === "approve"
          ? await approveCourseClaim({ claimId })
          : await rejectCourseClaim({ claimId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(action === "approve" ? "Zatwierdzone — właściciel przypisany." : "Odrzucone.");
      router.refresh();
    });

  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => decide("approve")}
        disabled={isPending}
        className="rounded-md border border-input px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
      >
        Zatwierdź
      </button>
      <button
        type="button"
        onClick={() => decide("reject")}
        disabled={isPending}
        className="rounded-md border border-input px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
      >
        Odrzuć
      </button>
    </div>
  );
}
