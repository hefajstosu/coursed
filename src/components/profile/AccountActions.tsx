"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { deleteAccount } from "@/server/actions/account";

export function AccountActions() {
  const [isPending, start] = useTransition();

  const onDelete = () => {
    if (
      !confirm(
        "Trwale usunąć konto? Twoje oceny, opinie, głosy i zgłoszenia zostaną nieodwracalnie usunięte.",
      )
    )
      return;
    if (!confirm("Na pewno? Tej operacji nie można cofnąć.")) return;

    start(async () => {
      const res = await deleteAccount();
      // Przy powodzeniu server action wylogowuje i przekierowuje — kod poniżej
      // wykona się tylko, gdy zwrócono błąd.
      if (res && !res.ok) toast.error(res.error);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <a
        href="/api/me/export"
        className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
      >
        <Download className="size-4" />
        Pobierz moje dane (JSON)
      </a>
      <button
        type="button"
        onClick={onDelete}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
      >
        <Trash2 className="size-4" />
        {isPending ? "Usuwam konto…" : "Usuń konto"}
      </button>
    </div>
  );
}
