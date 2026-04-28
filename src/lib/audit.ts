import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

type AuditInput = {
  actorId: string;
  action: string; // np. "course.create", "review.hide", "course.merge"
  entity: string; // np. "Course", "Review", "User"
  entityId: string;
  diff?: Prisma.InputJsonValue;
};

export async function logAudit(input: AuditInput) {
  await db.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      diff: input.diff,
    },
  });
}
