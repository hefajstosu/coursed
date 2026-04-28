"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import type { UserRole } from "@/generated/prisma/enums";

const setRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "CRITIC", "EDITOR", "ADMIN"]),
});

export type AdminActionResult = { ok: true } | { ok: false; error: string };

export async function setUserRole(input: { userId: string; role: UserRole }): Promise<AdminActionResult> {
  try {
    const actor = await requireRole("ADMIN");
    const data = setRoleSchema.parse(input);

    if (data.userId === actor.id && data.role !== "ADMIN") {
      return { ok: false, error: "Nie możesz odebrać sobie roli ADMIN." };
    }

    const before = await db.user.findUnique({
      where: { id: data.userId },
      select: { role: true },
    });
    if (!before) return { ok: false, error: "Użytkownik nie istnieje." };
    if (before.role === data.role) return { ok: true };

    await db.user.update({
      where: { id: data.userId },
      data: { role: data.role },
    });

    await logAudit({
      actorId: actor.id,
      action: "user.set_role",
      entity: "User",
      entityId: data.userId,
      diff: { from: before.role, to: data.role },
    });

    revalidatePath("/admin/uzytkownicy");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}
