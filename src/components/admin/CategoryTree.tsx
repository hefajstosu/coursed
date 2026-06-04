"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CategoryForm, type CategoryFormDefaults } from "@/components/admin/CategoryForm";
import { pluralPl } from "@/lib/format";

type Cat = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parentId: string | null;
  _count: { courses: number };
  children: Cat[];
};

export function CategoryTree({
  tree,
  parents,
  canDelete,
}: {
  tree: Cat[];
  parents: { id: string; name: string }[];
  canDelete: boolean;
}) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            + Nowa kategoria
          </Button>
        )}
      </div>

      {creating && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Nowa kategoria</h3>
          <CategoryForm
            mode="create"
            defaults={{ name: "", slug: "", description: "", parentId: "" }}
            parents={parents}
            onClose={() => setCreating(false)}
          />
        </div>
      )}

      {tree.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          Brak kategorii.
        </div>
      ) : (
        <ul className="rounded-lg border border-border bg-card divide-y divide-border">
          {tree.map((c) => (
            <CategoryRow
              key={c.id}
              cat={c}
              parents={parents}
              canDelete={canDelete}
              editingId={editingId}
              setEditingId={setEditingId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryRow({
  cat,
  parents,
  canDelete,
  editingId,
  setEditingId,
  level = 0,
}: {
  cat: Cat;
  parents: { id: string; name: string }[];
  canDelete: boolean;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  level?: number;
}) {
  const isEditing = editingId === cat.id;
  const defaults: CategoryFormDefaults = {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description ?? "",
    parentId: cat.parentId ?? "",
  };

  return (
    <li>
      <div
        className="flex items-center justify-between gap-3 px-4 py-2.5"
        style={{ paddingLeft: `${level * 24 + 16}px` }}
      >
        <div className="min-w-0">
          <span className="font-medium">{cat.name}</span>
          <span className="text-xs text-muted-foreground font-mono ml-2">/{cat.slug}</span>
          <span className="text-xs text-muted-foreground ml-3">
            {cat._count.courses} {pluralPl(cat._count.courses, ["kurs", "kursy", "kursów"])}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setEditingId(isEditing ? null : cat.id)}
          className="rounded-md border border-input px-2 py-1 text-xs hover:bg-muted"
        >
          {isEditing ? "Zwiń" : "Edytuj"}
        </button>
      </div>

      {isEditing && (
        <div className="border-t border-border bg-muted/30 px-4 py-4" style={{ paddingLeft: `${level * 24 + 16}px` }}>
          <CategoryForm
            mode="edit"
            defaults={defaults}
            parents={parents}
            canDelete={canDelete}
            onClose={() => setEditingId(null)}
          />
        </div>
      )}

      {cat.children.length > 0 && (
        <ul className="border-t border-border divide-y divide-border">
          {cat.children.map((child) => (
            <CategoryRow
              key={child.id}
              cat={child}
              parents={parents}
              canDelete={canDelete}
              editingId={editingId}
              setEditingId={setEditingId}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
