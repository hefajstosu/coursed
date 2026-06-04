"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { setUserRole, setUserBanned } from "@/server/actions/admin/users";
import type { UserRole } from "@/generated/prisma/enums";

const ROLES: UserRole[] = ["USER", "CRITIC", "EDITOR", "ADMIN"];

export function UserRoleSelect({
  userId,
  initial,
  isSelf,
  isAdmin,
}: {
  userId: string;
  initial: UserRole;
  isSelf: boolean;
  isAdmin: boolean;
}) {
  const [value, setValue] = useState<UserRole>(initial);
  const [isPending, startTransition] = useTransition();

  const onChange = (next: UserRole) => {
    if (next === value) return;
    const prev = value;
    setValue(next);
    startTransition(async () => {
      const res = await setUserRole({ userId, role: next });
      if (!res.ok) {
        setValue(prev);
        toast.error(res.error);
      } else {
        toast.success(`Rola: ${next}`);
      }
    });
  };

  if (!isAdmin) {
    return <span className="text-sm text-muted-foreground">{value}</span>;
  }

  return (
    <select
      value={value}
      disabled={isPending || isSelf}
      onChange={(e) => onChange(e.target.value as UserRole)}
      className="rounded-md border border-input bg-transparent px-2 py-1 text-xs disabled:opacity-50"
      title={isSelf ? "Nie możesz zmienić własnej roli." : undefined}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}

export function BanButton({
  userId,
  initialBanned,
}: {
  userId: string;
  initialBanned: boolean;
}) {
  const router = useRouter();
  const [banned, setBanned] = useState(initialBanned);
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    if (!banned && !confirm("Zawiesić konto? Użytkownik nie będzie mógł dodawać ocen ani opinii.")) {
      return;
    }
    startTransition(async () => {
      const res = await setUserBanned({ userId, banned: !banned });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setBanned(!banned);
      toast.success(!banned ? "Konto zawieszone." : "Konto odwieszone.");
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={`rounded-md border px-2 py-1 text-xs transition-colors disabled:opacity-50 ${
        banned
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-input text-muted-foreground hover:bg-muted"
      }`}
    >
      {banned ? "Zawieszony — przywróć" : "Zawieś"}
    </button>
  );
}
