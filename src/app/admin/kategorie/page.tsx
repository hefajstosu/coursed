import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { CategoryTree } from "@/components/admin/CategoryTree";

export const metadata: Metadata = { title: "Kategorie" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const actor = await requireRole("ADMIN", "EDITOR");

  const cats = await db.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { courses: true } } },
  });

  // Buduj drzewo: root + children
  const byParent = new Map<string | null, typeof cats>();
  for (const c of cats) {
    const key = c.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  }

  type TreeNode = (typeof cats)[number] & { children: TreeNode[] };
  const buildTree = (parentId: string | null): TreeNode[] =>
    (byParent.get(parentId) ?? []).map((c) => ({
      ...c,
      children: buildTree(c.id),
    }));

  const tree = buildTree(null);

  // Lista możliwych rodziców = tylko top-level (max 2 poziomy)
  const parents = cats
    .filter((c) => c.parentId === null)
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Kategorie</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drzewo kategorii (max 2 poziomy). Kategoria nadrzędna nie może mieć kursów ani być wewnątrz innej.
        </p>
      </header>

      <CategoryTree tree={tree} parents={parents} canDelete={actor.role === "ADMIN"} />
    </div>
  );
}
