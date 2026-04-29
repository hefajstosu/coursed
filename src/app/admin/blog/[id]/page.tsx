import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { BlogPostForm, type BlogPostFormDefaults } from "@/components/admin/BlogPostForm";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await db.blogPost.findUnique({ where: { id }, select: { title: true } });
  return { title: post ? `Edytuj: ${post.title}` : "Wpis" };
}

export default async function EditBlogPostPage({ params }: PageProps) {
  const actor = await requireRole("ADMIN", "EDITOR");
  const { id } = await params;
  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  const defaults: BlogPostFormDefaults = {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    content: post.content,
    coverUrl: post.coverUrl ?? "",
    status: post.status,
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Edytuj wpis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {post.status === "PUBLISHED" ? (
            <Link href={`/blog/${post.slug}`} target="_blank" className="hover:underline">
              /blog/{post.slug} ↗
            </Link>
          ) : (
            <span>Wersja robocza — niewidoczna publicznie.</span>
          )}
        </p>
      </header>
      <BlogPostForm
        mode="edit"
        postId={post.id}
        defaults={defaults}
        canDelete={actor.role === "ADMIN"}
      />
    </div>
  );
}
