"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Bell, BellRing } from "lucide-react";
import { toggleFollow } from "@/server/actions/follow";
import { cn } from "@/lib/utils";

export function FollowButton({
  courseId,
  initialFollowing,
  isLoggedIn,
}: {
  courseId: string;
  initialFollowing: boolean;
  isLoggedIn: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, start] = useTransition();

  const onClick = () => {
    if (!isLoggedIn) {
      toast.error("Zaloguj się, aby obserwować kurs.");
      return;
    }
    const prev = following;
    setFollowing(!prev);
    start(async () => {
      const res = await toggleFollow({ courseId });
      if (!res.ok) {
        setFollowing(prev);
        toast.error(res.error);
        return;
      }
      setFollowing(res.following);
      toast.success(
        res.following
          ? "Obserwujesz kurs — powiadomimy o nowych opiniach."
          : "Przestałeś obserwować kurs.",
      );
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-pressed={following}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors disabled:opacity-60",
        following
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "border-border hover:bg-muted",
      )}
    >
      {following ? <BellRing className="size-4" /> : <Bell className="size-4" />}
      {following ? "Obserwujesz" : "Obserwuj kurs"}
    </button>
  );
}
