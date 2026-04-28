"use client";

import { useState, useTransition } from "react";
import { ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { voteHelpful } from "@/server/actions/courses";
import { cn } from "@/lib/utils";

type Props = {
  reviewId: string;
  initialCount: number;
  initialVoted: boolean;
  isLoggedIn: boolean;
};

export function HelpfulButton({ reviewId, initialCount, initialVoted, isLoggedIn }: Props) {
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  const click = () => {
    if (!isLoggedIn) {
      toast.error("Zaloguj się, aby głosować.");
      return;
    }
    const optimisticVoted = !voted;
    setVoted(optimisticVoted);
    setCount((c) => c + (optimisticVoted ? 1 : -1));
    startTransition(async () => {
      const res = await voteHelpful({ reviewId });
      if (!res.ok) {
        setVoted(!optimisticVoted);
        setCount((c) => c + (optimisticVoted ? -1 : 1));
        toast.error(res.error);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={click}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs transition-colors disabled:opacity-60",
        voted ? "border-primary/40 bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
      aria-pressed={voted}
    >
      <ThumbsUp className="size-3" />
      <span className="tabular-nums">{count}</span>
      <span className="hidden sm:inline">Pomocna</span>
    </button>
  );
}
