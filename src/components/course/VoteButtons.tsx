"use client";

import { useState, useTransition } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { voteReview } from "@/server/actions/courses";
import { cn } from "@/lib/utils";

type Props = {
  reviewId: string;
  initialHelpful: number;
  initialUnhelpful: number;
  initialVote: 1 | -1 | null;
  isLoggedIn: boolean;
};

export function VoteButtons({
  reviewId,
  initialHelpful,
  initialUnhelpful,
  initialVote,
  isLoggedIn,
}: Props) {
  const [vote, setVote] = useState<1 | -1 | null>(initialVote);
  const [helpful, setHelpful] = useState(initialHelpful);
  const [unhelpful, setUnhelpful] = useState(initialUnhelpful);
  const [isPending, startTransition] = useTransition();

  const click = (next: 1 | -1) => {
    if (!isLoggedIn) {
      toast.error("Zaloguj się, aby głosować.");
      return;
    }

    const prev = vote;
    let nextVote: 1 | -1 | null;
    let dHelpful = 0;
    let dUnhelpful = 0;

    if (prev === next) {
      nextVote = null;
      if (next === 1) dHelpful = -1;
      else dUnhelpful = -1;
    } else if (prev === null) {
      nextVote = next;
      if (next === 1) dHelpful = 1;
      else dUnhelpful = 1;
    } else {
      nextVote = next;
      if (next === 1) {
        dHelpful = 1;
        dUnhelpful = -1;
      } else {
        dHelpful = -1;
        dUnhelpful = 1;
      }
    }

    setVote(nextVote);
    setHelpful((c) => c + dHelpful);
    setUnhelpful((c) => c + dUnhelpful);

    startTransition(async () => {
      const res = await voteReview({ reviewId, value: next });
      if (!res.ok) {
        setVote(prev);
        setHelpful((c) => c - dHelpful);
        setUnhelpful((c) => c - dUnhelpful);
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => click(1)}
        disabled={isPending}
        aria-pressed={vote === 1}
        aria-label="Oznacz jako pomocną"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs transition-colors disabled:opacity-60",
          vote === 1
            ? "border-primary/40 bg-primary/10 text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <ThumbsUp className="size-3" />
        <span className="tabular-nums">{helpful}</span>
      </button>
      <button
        type="button"
        onClick={() => click(-1)}
        disabled={isPending}
        aria-pressed={vote === -1}
        aria-label="Oznacz jako niepomocną"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs transition-colors disabled:opacity-60",
          vote === -1
            ? "border-destructive/40 bg-destructive/10 text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <ThumbsDown className="size-3" />
        <span className="tabular-nums">{unhelpful}</span>
      </button>
    </div>
  );
}
