"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { categoryFormSchema } from "@/schemas/admin-categories";

export type CategoryActionResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

function parseForm(formData: FormData) {
  return categoryFormSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    parentId: formData.get("parentId"),
  });
}

function flatten(parsed: ReturnType<typeof parseForm>): { ok: false; error: string; fieldErrors: Record<string, string> } {
  const fe = parsed.success ? {} : parsed.error.flatten().fieldErrors;
  const fieldErrors: Record<string, string> = {};
  for (const [k, v] of Object.entries(fe)) {
    if (v && v[0]) fieldErrors[k] = v[0];
  }
  return { ok: false, error: "Popraw zaznaczone pola.", fieldErrors };
}

export async function createCategory(_prev: CategoryActionResult, formData: FormData): Promise<CategoryActionResult> {
  const actor = await requireRole("ADMIN", "EDITOR");
  const parsed = parseForm(formData);
  if (!parsed.success) return flatten(parsed);

  const data = parsed.data;
  const taken = await db.category.findUnique({ where: { slug: data.slug }, select: { id: true } });
  if (taken) return { ok: false, error: "", fieldErrors: { slug: "Slug już zajęty" } };

  if (data.parentId) {
    const parent = await db.category.findUnique({ where: { id: data.parentId }, select: { parentId: true } });
    if (!parent) return { ok: false, error: "Kategoria nadrzędna nie istnieje." };
    if (parent.parentId) return { ok: false, error: "Kategoria nadrzędna sama ma rodzica — max 2 poziomy." };
  }

  const created = await db.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      parentId: data.parentId ?? null,
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "category.create",
    entity: "Category",
    entityId: created.id,
    diff: { slug: data.slug, parentId: data.parentId ?? null },
  });

  revalidatePath("/admin/kategorie");
  return { ok: true };
}

export async function updateCategory(
  categoryId: string,
  _prev: CategoryActionResult,
  formData: FormData,
): Promise<CategoryActionResult> {
  const actor = await requireRole("ADMIN", "EDITOR");
  const parsed = parseForm(formData);
  if (!parsed.success) return flatten(parsed);

  const data = parsed.data;
  const before = await db.category.findUnique({ where: { id: categoryId } });
  if (!before) return { ok: false, error: "Kategoria nie istnieje." };

  if (data.slug !== before.slug) {
    const taken = await db.category.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (taken) return { ok: false, error: "", fieldErrors: { slug: "Slug już zajęty" } };
  }

  if (data.parentId === categoryId) {
    return { ok: false, error: "Kategoria nie może być rodzicem samej siebie." };
  }
  if (data.parentId) {
    const parent = await db.category.findUnique({ where: { id: data.parentId }, select: { parentId: true } });
    if (!parent) return { ok: false, error: "Kategoria nadrzędna nie istnieje." };
    if (parent.parentId) return { ok: false, error: "Kategoria nadrzędna sama ma rodzica — max 2 poziomy." };
  }

  // Jeśli kategoria ma dzieci i staje się dzieckiem innej → naruszenie max 2 poziomów
  if (data.parentId) {
    const childrenCount = await db.category.count({ where: { parentId: categoryId } });
    if (childrenCount > 0) {
      return { ok: false, error: "Kategoria z podkategoriami nie może mieć rodzica." };
    }
  }

  await db.category.update({
    where: { id: categoryId },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      parentId: data.parentId ?? null,
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "category.update",
    entity: "Category",
    entityId: categoryId,
    diff: { from: { slug: before.slug, parentId: before.parentId }, to: { slug: data.slug, parentId: data.parentId ?? null } },
  });

  revalidatePath("/admin/kategorie");
  revalidatePath(`/kategoria/${data.slug}`);
  if (before.slug !== data.slug) revalidatePath(`/kategoria/${before.slug}`);
  return { ok: true };
}

export async function deleteCategory(categoryId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const actor = await requireRole("ADMIN");
    const cat = await db.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { courses: true, children: true } } },
    });
    if (!cat) return { ok: false, error: "Kategoria nie istnieje." };
    if (cat._count.courses > 0) {
      return { ok: false, error: `Kategoria ma ${cat._count.courses} przypisanych kursów.` };
    }
    if (cat._count.children > 0) {
      return { ok: false, error: `Kategoria ma ${cat._count.children} podkategorii.` };
    }

    await db.category.delete({ where: { id: categoryId } });

    await logAudit({
      actorId: actor.id,
      action: "category.delete",
      entity: "Category",
      entityId: categoryId,
      diff: { slug: cat.slug },
    });

    revalidatePath("/admin/kategorie");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}
