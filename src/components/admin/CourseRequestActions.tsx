"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { acceptCourseRequest, rejectCourseRequest } from "@/server/actions/admin/requests";

export function CourseRequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const accept = () =>
    startTransition(async () => {
      const res = await acceptCourseRequest({ requestId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Utworzono kurs w wersji roboczej.");
      if (res.redirectTo) router.push(res.redirectTo);
    });

  const reject = () =>
    startTransition(async () => {
      if (!confirm("Odrzucić zgłoszenie?")) return;
      const res = await rejectCourseRequest({ requestId });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Zgłoszenie odrzucone.");
      router.refresh();
    });

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={accept} disabled={isPending}>
        Akceptuj
      </Button>
      <Button size="sm" variant="outline" onClick={reject} disabled={isPending}>
        Odrzuć
      </Button>
    </div>
  );
}
