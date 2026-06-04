"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryActionResult,
} from "@/server/actions/admin/categories";
import { slugify } from "@/lib/slug";

const initialState: CategoryActionResult = {};

export type CategoryFormDefaults = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  parentId: string;
};

export function CategoryForm({
  mode,
  defaults,
  parents,
  canDelete,
  onClose,
}: {
  mode: "create" | "edit";
  defaults: CategoryFormDefaults;
  parents: { id: string; name: string }[];
  canDelete?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const action =
    mode === "create"
      ? createCategory
      : updateCategory.bind(null, defaults.id!);

  const [state, formAction, pending] = useActionState(action, initialState);

  const [name, setName] = useState(defaults.name);
  const [slug, setSlug] = useState(defaults.slug);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  useEffect(() => {
    if (state.ok === true) {
      toast.success(mode === "create" ? "Kategoria utworzona." : "Zapisano.");
      router.refresh();
      onClose?.();
    } else if (state.ok === false && state.error && !state.fieldErrors) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const fieldErrors = state.fieldErrors;

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor={`name-${defaults.id ?? "new"}`} className="text-sm">
          Nazwa *
        </Label>
        <Input
          id={`name-${defaults.id ?? "new"}`}
          name="name"
          required
          value={name}
          onChange={(e) => {
            const v = e.target.value;
            setName(v);
            if (!slugTouched) setSlug(slugify(v));
          }}
          aria-invalid={!!fieldErrors?.name}
          disabled={pending}
        />
        {fieldErrors?.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`slug-${defaults.id ?? "new"}`} className="text-sm">
          Slug *
        </Label>
        <Input
          id={`slug-${defaults.id ?? "new"}`}
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          aria-invalid={!!fieldErrors?.slug}
          disabled={pending}
        />
        {fieldErrors?.slug && <p className="text-xs text-destructive">{fieldErrors.slug}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`parent-${defaults.id ?? "new"}`} className="text-sm">
          Kategoria nadrzędna
        </Label>
        <select
          id={`parent-${defaults.id ?? "new"}`}
          name="parentId"
          defaultValue={defaults.parentId}
          disabled={pending}
          className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="">— (kategoria główna)</option>
          {parents
            .filter((p) => p.id !== defaults.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`desc-${defaults.id ?? "new"}`} className="text-sm">
          Opis
        </Label>
        <Textarea
          id={`desc-${defaults.id ?? "new"}`}
          name="description"
          rows={3}
          defaultValue={defaults.description}
          disabled={pending}
        />
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Zapisuję…" : mode === "create" ? "Utwórz" : "Zapisz"}
          </Button>
          {onClose && (
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={pending}>
              Anuluj
            </Button>
          )}
        </div>
        {mode === "edit" && canDelete && defaults.id && (
          <DeleteButton categoryId={defaults.id} onClose={onClose} />
        )}
      </div>
    </form>
  );
}

function DeleteButton({ categoryId, onClose }: { categoryId: string; onClose?: () => void }) {
  const router = useRouter();
  const onClick = async () => {
    if (!confirm("Usunąć kategorię?")) return;
    const res = await deleteCategory(categoryId);
    if (!res.ok) {
      toast.error(res.error ?? "Nie udało się usunąć");
      return;
    }
    toast.success("Usunięto.");
    router.refresh();
    onClose?.();
  };
  return (
    <Button type="button" size="sm" variant="outline" onClick={onClick} className="text-destructive">
      Usuń
    </Button>
  );
}
