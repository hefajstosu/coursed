"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "@/server/actions/admin/blog";
import type { AdminFormState } from "@/server/actions/admin/courses";
import { slugify } from "@/lib/slug";

export type BlogPostFormDefaults = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverUrl: string;
  status: "DRAFT" | "PUBLISHED";
};

const initialState: AdminFormState = {};

export function BlogPostForm({
  mode,
  postId,
  defaults,
  canDelete,
}: {
  mode: "create" | "edit";
  postId?: string;
  defaults: BlogPostFormDefaults;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const action = mode === "create" ? createBlogPost : updateBlogPost.bind(null, postId!);
  const [state, formAction, pending] = useActionState(action, initialState);

  const [title, setTitle] = useState(defaults.title);
  const [slug, setSlug] = useState(defaults.slug);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  useEffect(() => {
    if (state.ok && mode === "edit") {
      toast.success("Zapisano.");
    } else if (state.error && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, mode]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title" className="text-sm">
          Tytuł *
        </Label>
        <Input
          id="title"
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={!!state.fieldErrors?.title}
          disabled={pending}
        />
        {state.fieldErrors?.title && (
          <p className="text-xs text-destructive">{state.fieldErrors.title}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug" className="text-sm">
          Slug *
        </Label>
        <Input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          aria-invalid={!!state.fieldErrors?.slug}
          disabled={pending}
        />
        {state.fieldErrors?.slug && (
          <p className="text-xs text-destructive">{state.fieldErrors.slug}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="coverUrl" className="text-sm">
          URL okładki
        </Label>
        <Input
          id="coverUrl"
          name="coverUrl"
          type="url"
          defaultValue={defaults.coverUrl}
          aria-invalid={!!state.fieldErrors?.coverUrl}
          disabled={pending}
        />
        {state.fieldErrors?.coverUrl && (
          <p className="text-xs text-destructive">{state.fieldErrors.coverUrl}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="excerpt" className="text-sm">
          Zajawka
        </Label>
        <Textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          maxLength={500}
          defaultValue={defaults.excerpt}
          disabled={pending}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="content" className="text-sm">
          Treść (Markdown) *
        </Label>
        <Textarea
          id="content"
          name="content"
          rows={16}
          defaultValue={defaults.content}
          aria-invalid={!!state.fieldErrors?.content}
          disabled={pending}
          className="font-mono text-sm"
          required
        />
        {state.fieldErrors?.content ? (
          <p className="text-xs text-destructive">{state.fieldErrors.content}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Obsługiwane: ## h2, ### h3, paragrafy, listy „- ”, **bold**, *italic*, `code`, [linki](url).
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status" className="text-sm">
          Status
        </Label>
        <select
          id="status"
          name="status"
          defaultValue={defaults.status}
          disabled={pending}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="DRAFT">Wersja robocza</option>
          <option value="PUBLISHED">Opublikowany</option>
        </select>
      </div>

      {state.error && !state.fieldErrors && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex items-center justify-between gap-3 sticky bottom-0 bg-background/80 backdrop-blur py-3 border-t border-border">
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Zapisuję…" : mode === "create" ? "Utwórz wpis" : "Zapisz"}
          </Button>
          {mode === "edit" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/blog")}
              disabled={pending}
            >
              Anuluj
            </Button>
          )}
        </div>
        {mode === "edit" && canDelete && postId && <DeleteButton postId={postId} />}
      </div>
    </form>
  );
}

function DeleteButton({ postId }: { postId: string }) {
  const router = useRouter();
  const onClick = async () => {
    if (!confirm("Usunąć wpis?")) return;
    const res = await deleteBlogPost(postId);
    if (!res.ok) {
      toast.error(res.error ?? "Nie udało się usunąć");
      return;
    }
    toast.success("Usunięto.");
    router.push("/admin/blog");
  };
  return (
    <Button type="button" variant="outline" onClick={onClick} className="text-destructive">
      Usuń wpis
    </Button>
  );
}
