"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { courseFormSchema, type CourseFormInput } from "@/schemas/admin-courses";

export type AdminFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
};

function parseForm(formData: FormData): CourseFormInput | { _error: AdminFormState } {
  const raw = {
    title: formData.get("title"),
    slug: formData.get("slug"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    coverUrl: formData.get("coverUrl"),
    authorName: formData.get("authorName"),
    platformName: formData.get("platformName"),
    officialUrl: formData.get("officialUrl"),
    priceModel: formData.get("priceModel"),
    language: formData.get("language"),
    level: formData.get("level"),
    format: formData.get("format"),
    hasCertificate: formData.get("hasCertificate") === "on",
    location: formData.get("location"),
    status: formData.get("status"),
    categoryIds: formData.getAll("categoryIds").map(String).filter(Boolean),
  };

  const parsed = courseFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(fe)) {
      if (v && v[0]) fieldErrors[k] = v[0];
    }
    return {
      _error: {
        ok: false,
        error: "Popraw zaznaczone pola.",
        fieldErrors,
      },
    };
  }
  return parsed.data;
}

export async function createCourse(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const actor = await requireRole("ADMIN", "EDITOR");
  const result = parseForm(formData);
  if ("_error" in result) return result._error;

  const data = result;
  const slugTaken = await db.course.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });
  if (slugTaken) {
    return { ok: false, fieldErrors: { slug: "Slug już zajęty" } };
  }

  const course = await db.course.create({
    data: {
      title: data.title,
      slug: data.slug,
      shortDescription: data.shortDescription ?? null,
      description: data.description ?? null,
      coverUrl: data.coverUrl ?? null,
      authorName: data.authorName ?? null,
      platformName: data.platformName ?? null,
      officialUrl: data.officialUrl ?? null,
      priceModel: data.priceModel ?? null,
      language: data.language ?? null,
      level: (data.level as CourseFormInput["level"]) || null,
      format: data.format,
      hasCertificate: data.hasCertificate,
      location: data.location ?? null,
      status: data.status,
      categories: {
        create: data.categoryIds.map((categoryId) => ({ categoryId })),
      },
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "course.create",
    entity: "Course",
    entityId: course.id,
    diff: { slug: course.slug, status: course.status },
  });

  revalidatePath("/admin/kursy");
  revalidatePath("/kursy");
  redirect(`/admin/kursy/${course.id}`);
}

export async function updateCourse(
  courseId: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const actor = await requireRole("ADMIN", "EDITOR");
  const result = parseForm(formData);
  if ("_error" in result) return result._error;
  const data = result;

  const before = await db.course.findUnique({
    where: { id: courseId },
    select: { slug: true, status: true, title: true },
  });
  if (!before) return { ok: false, error: "Kurs nie istnieje." };

  if (data.slug !== before.slug) {
    const slugTaken = await db.course.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (slugTaken) return { ok: false, fieldErrors: { slug: "Slug już zajęty" } };
  }

  await db.$transaction([
    db.course.update({
      where: { id: courseId },
      data: {
        title: data.title,
        slug: data.slug,
        shortDescription: data.shortDescription ?? null,
        description: data.description ?? null,
        coverUrl: data.coverUrl ?? null,
        authorName: data.authorName ?? null,
        platformName: data.platformName ?? null,
        officialUrl: data.officialUrl ?? null,
        priceModel: data.priceModel ?? null,
        language: data.language ?? null,
        level: (data.level as CourseFormInput["level"]) || null,
        format: data.format,
        hasCertificate: data.hasCertificate,
        location: data.location ?? null,
        status: data.status,
      },
    }),
    db.courseCategory.deleteMany({ where: { courseId } }),
    ...(data.categoryIds.length > 0
      ? [
          db.courseCategory.createMany({
            data: data.categoryIds.map((categoryId) => ({ courseId, categoryId })),
          }),
        ]
      : []),
  ]);

  await logAudit({
    actorId: actor.id,
    action: "course.update",
    entity: "Course",
    entityId: courseId,
    diff: { from: before, to: { slug: data.slug, status: data.status, title: data.title } },
  });

  revalidatePath("/admin/kursy");
  revalidatePath(`/kursy/${data.slug}`);
  if (before.slug !== data.slug) revalidatePath(`/kursy/${before.slug}`);
  return { ok: true };
}

export async function deleteCourse(courseId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const actor = await requireRole("ADMIN");
    const before = await db.course.findUnique({
      where: { id: courseId },
      select: { slug: true, title: true },
    });
    if (!before) return { ok: false, error: "Kurs nie istnieje." };

    await db.course.delete({ where: { id: courseId } });

    await logAudit({
      actorId: actor.id,
      action: "course.delete",
      entity: "Course",
      entityId: courseId,
      diff: { slug: before.slug, title: before.title },
    });

    revalidatePath("/admin/kursy");
    revalidatePath("/kursy");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}
