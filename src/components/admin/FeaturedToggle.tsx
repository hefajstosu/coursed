"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { setCourseFeatured } from "@/server/actions/admin/courses";
import { cn } from "@/lib/utils";

/** #19 Toggle „polecane przez redakcję" w liście kursów admina. */
export function FeaturedToggle({ courseId, initial }: { courseId: string; initial: boolean }) {
  const router = useRouter();
  const [featured, setFeatured] = useState(initial);
  const [isPending, start] = useTransition();

  const toggle = () =>
    start(async () => {
      const res = await setCourseFeatured(courseId, !featured);
      if (!res.ok) {
        toast.error(res.error ?? "Błąd");
        return;
      }
      setFeatured(!featured);
      toast.success(!featured ? "Dodano do polecanych." : "Usunięto z polecanych.");
      router.refresh();
    });

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={featured}
      title="Polecane przez redakcję"
      className={cn(
        "inline-flex items-center justify-center rounded-md border p-1.5 transition-colors disabled:opacity-50",
        featured
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-input text-muted-foreground hover:bg-muted",
      )}
    >
      <Star className={cn("size-4", featured && "fill-primary")} />
    </button>
  );
}
