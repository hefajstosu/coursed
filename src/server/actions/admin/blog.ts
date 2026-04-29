"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { blogPostFormSchema } from "@/schemas/admin-blog";
import type { AdminFormState } from "@/server/actions/admin/courses";

function parseForm(formData: FormData) {
  const parsed = blogPostFormSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    coverUrl: formData.get("coverUrl"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(fe)) {
      if (v && v[0]) fieldErrors[k] = v[0];
    }
    return { _error: { ok: false, error: "Popraw zaznaczone pola.", fieldErrors } as AdminFormState };
  }
  return parsed.data;
}

export async function createBlogPost(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const actor = await requireRole("ADMIN", "EDITOR");
  const result = parseForm(formData);
  if ("_error" in result) return result._error;
  const data = result;

  const taken = await db.blogPost.findUnique({ where: { slug: data.slug }, select: { id: true } });
  if (taken) return { ok: false, fieldErrors: { slug: "Slug już zajęty" } };

  const post = await db.blogPost.create({
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt ?? null,
      content: data.content,
      coverUrl: data.coverUrl ?? null,
      status: data.status,
      authorId: actor.id,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "blog.create",
    entity: "BlogPost",
    entityId: post.id,
    diff: { slug: post.slug, status: post.status },
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  if (post.status === "PUBLISHED") revalidatePath(`/blog/${post.slug}`);
  redirect(`/admin/blog/${post.id}`);
}

export async function updateBlogPost(
  postId: string,
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const actor = await requireRole("ADMIN", "EDITOR");
  const result = parseForm(formData);
  if ("_error" in result) return result._error;
  const data = result;

  const before = await db.blogPost.findUnique({ where: { id: postId } });
  if (!before) return { ok: false, error: "Wpis nie istnieje." };

  if (data.slug !== before.slug) {
    const taken = await db.blogPost.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (taken) return { ok: false, fieldErrors: { slug: "Slug już zajęty" } };
  }

  // Pierwsze opublikowanie ustawia publishedAt; późniejsze zmiany go nie ruszają.
  const publishedAt =
    data.status === "PUBLISHED" && !before.publishedAt
      ? new Date()
      : before.publishedAt;

  await db.blogPost.update({
    where: { id: postId },
    data: {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt ?? null,
      content: data.content,
      coverUrl: data.coverUrl ?? null,
      status: data.status,
      publishedAt,
    },
  });

  await logAudit({
    actorId: actor.id,
    action: "blog.update",
    entity: "BlogPost",
    entityId: postId,
    diff: { from: { slug: before.slug, status: before.status }, to: { slug: data.slug, status: data.status } },
  });

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${data.slug}`);
  if (before.slug !== data.slug) revalidatePath(`/blog/${before.slug}`);
  return { ok: true };
}

export async function deleteBlogPost(postId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const actor = await requireRole("ADMIN");
    const before = await db.blogPost.findUnique({ where: { id: postId }, select: { slug: true, title: true } });
    if (!before) return { ok: false, error: "Wpis nie istnieje." };

    await db.blogPost.delete({ where: { id: postId } });

    await logAudit({
      actorId: actor.id,
      action: "blog.delete",
      entity: "BlogPost",
      entityId: postId,
      diff: { slug: before.slug, title: before.title },
    });

    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}
