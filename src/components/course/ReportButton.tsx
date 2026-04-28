"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { reportReview } from "@/server/actions/courses";

type Props = {
  reviewId: string;
  isLoggedIn: boolean;
};

export function ReportButton({ reviewId, isLoggedIn }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!isLoggedIn) return null;

  const submit = () => {
    startTransition(async () => {
      const res = await reportReview({ reviewId, reason: reason.trim() || undefined });
      if (!res.ok) {
        toast.error(res.error);
      } else {
        toast.success("Zgłoszenie przyjęte. Dziękujemy.");
        setOpen(false);
        setReason("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <Flag className="size-3" />
        <span className="hidden sm:inline">Zgłoś</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zgłoś opinię</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Opisz, co jest nie tak z tą opinią — spam, mowa nienawiści, treść niezgodna z regulaminem.
        </p>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Powód (opcjonalnie)"
          rows={3}
          disabled={isPending}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>
            Anuluj
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? "Wysyłam…" : "Zgłoś"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
