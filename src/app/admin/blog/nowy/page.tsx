import type { Metadata } from "next";
import { BlogPostForm, type BlogPostFormDefaults } from "@/components/admin/BlogPostForm";
import { requireRole } from "@/lib/auth-helpers";

export const metadata: Metadata = { title: "Nowy wpis" };
export const dynamic = "force-dynamic";

const empty: BlogPostFormDefaults = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverUrl: "",
  status: "DRAFT",
};

export default async function NewBlogPostPage() {
  await requireRole("ADMIN", "EDITOR");
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Nowy wpis</h1>
      </header>
      <BlogPostForm mode="create" defaults={empty} />
    </div>
  );
}
