"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  createCourse,
  updateCourse,
  deleteCourse,
  type AdminFormState,
} from "@/server/actions/admin/courses";
import { slugify } from "@/lib/slug";
import { formatLabels, levelLabels, languageLabels } from "@/lib/format";

type CategoryOpt = { id: string; name: string; parentName?: string | null };

export type CourseFormDefaults = {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  coverUrl: string;
  authorName: string;
  platformName: string;
  officialUrl: string;
  priceModel: string;
  language: string;
  level: string;
  format: "ONLINE" | "OFFLINE" | "HYBRID";
  hasCertificate: boolean;
  location: string;
  status: "DRAFT" | "PUBLISHED";
  categoryIds: string[];
};

const initialState: AdminFormState = {};

export function CourseForm({
  mode,
  courseId,
  defaults,
  categories,
  canDelete,
}: {
  mode: "create" | "edit";
  courseId?: string;
  defaults: CourseFormDefaults;
  categories: CategoryOpt[];
  canDelete?: boolean;
}) {
  const router = useRouter();
  const action =
    mode === "create"
      ? createCourse
      : updateCourse.bind(null, courseId!);

  const [state, formAction, pending] = useActionState(action, initialState);
  const [title, setTitle] = useState(defaults.title);
  const [slug, setSlug] = useState(defaults.slug);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  useEffect(() => {
    if (state.ok && mode === "edit") {
      toast.success("Zapisano zmiany.");
    } else if (state.error && !state.fieldErrors) {
      toast.error(state.error);
    }
  }, [state, mode]);

  return (
    <form action={formAction} className="space-y-6">
      <Section title="Podstawowe">
        <Field
          label="Tytuł *"
          name="title"
          required
          value={title}
          onChange={(v) => {
            setTitle(v);
            if (!slugTouched) setSlug(slugify(v));
          }}
          error={state.fieldErrors?.title}
          disabled={pending}
        />
        <Field
          label="Slug *"
          name="slug"
          required
          value={slug}
          onChange={(v) => {
            setSlugTouched(true);
            setSlug(v);
          }}
          error={state.fieldErrors?.slug}
          hint="Generowany z tytułu, możesz nadpisać. Małe litery, cyfry i myślniki."
          disabled={pending}
        />
        <FieldArea
          label="Krótki opis"
          name="shortDescription"
          defaultValue={defaults.shortDescription}
          rows={2}
          maxLength={300}
          error={state.fieldErrors?.shortDescription}
          disabled={pending}
        />
        <FieldArea
          label="Pełny opis (Markdown)"
          name="description"
          defaultValue={defaults.description}
          rows={8}
          error={state.fieldErrors?.description}
          disabled={pending}
        />
      </Section>

      <Section title="Twórca i platforma">
        <Field
          label="Autor / prowadzący"
          name="authorName"
          defaultValue={defaults.authorName}
          error={state.fieldErrors?.authorName}
          disabled={pending}
        />
        <Field
          label="Platforma"
          name="platformName"
          defaultValue={defaults.platformName}
          error={state.fieldErrors?.platformName}
          disabled={pending}
        />
        <Field
          label="Oficjalny URL"
          name="officialUrl"
          type="url"
          defaultValue={defaults.officialUrl}
          error={state.fieldErrors?.officialUrl}
          disabled={pending}
        />
        <Field
          label="URL okładki"
          name="coverUrl"
          type="url"
          defaultValue={defaults.coverUrl}
          error={state.fieldErrors?.coverUrl}
          hint="Wklej link do obrazu (jpg/png/webp). Dozwolone hosty: images.unsplash.com (next.config.ts)."
          disabled={pending}
        />
      </Section>

      <Section title="Cechy">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            label="Forma *"
            name="format"
            defaultValue={defaults.format}
            options={Object.entries(formatLabels).map(([v, l]) => ({ value: v, label: l }))}
            disabled={pending}
          />
          <SelectField
            label="Poziom"
            name="level"
            defaultValue={defaults.level}
            options={[
              { value: "", label: "—" },
              ...Object.entries(levelLabels).map(([v, l]) => ({ value: v, label: l })),
            ]}
            disabled={pending}
          />
          <SelectField
            label="Język"
            name="language"
            defaultValue={defaults.language}
            options={[
              { value: "", label: "—" },
              ...Object.entries(languageLabels).map(([v, l]) => ({ value: v, label: l })),
            ]}
            disabled={pending}
          />
          <Field
            label="Cena / model"
            name="priceModel"
            defaultValue={defaults.priceModel}
            placeholder="np. 199 PLN, FREE, FREEMIUM"
            disabled={pending}
          />
          <Field
            label="Lokalizacja (offline/hybrid)"
            name="location"
            defaultValue={defaults.location}
            disabled={pending}
          />
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              name="hasCertificate"
              defaultChecked={defaults.hasCertificate}
              className="size-4 rounded border-input accent-primary"
              disabled={pending}
            />
            Wydaje certyfikat
          </label>
        </div>
      </Section>

      <Section title="Kategorie">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak kategorii. Dodaj je w sekcji Kategorie.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-72 overflow-y-auto rounded-md border border-border p-3">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={c.id}
                  defaultChecked={defaults.categoryIds.includes(c.id)}
                  className="size-4 rounded border-input accent-primary"
                  disabled={pending}
                />
                <span>
                  {c.parentName && <span className="text-muted-foreground">{c.parentName} / </span>}
                  {c.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </Section>

      <Section title="Publikacja">
        <SelectField
          label="Status"
          name="status"
          defaultValue={defaults.status}
          options={[
            { value: "DRAFT", label: "Wersja robocza" },
            { value: "PUBLISHED", label: "Opublikowany" },
          ]}
          disabled={pending}
        />
      </Section>

      {state.error && !state.fieldErrors && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex items-center justify-between gap-3 sticky bottom-0 bg-background/80 backdrop-blur py-3 border-t border-border">
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Zapisuję…" : mode === "create" ? "Utwórz kurs" : "Zapisz zmiany"}
          </Button>
          {mode === "edit" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/kursy")}
              disabled={pending}
            >
              Anuluj
            </Button>
          )}
        </div>
        {mode === "edit" && canDelete && courseId && (
          <DeleteButton courseId={courseId} />
        )}
      </div>
    </form>
  );
}

function DeleteButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const onClick = async () => {
    if (!confirm("Na pewno usunąć kurs? Operacji nie można cofnąć.")) return;
    const res = await deleteCourse(courseId);
    if (!res.ok) {
      toast.error(res.error ?? "Nie udało się usunąć");
      return;
    }
    toast.success("Kurs usunięty.");
    router.push("/admin/kursy");
  };

  return (
    <Button type="button" variant="outline" onClick={onClick} className="text-destructive">
      Usuń kurs
    </Button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  value,
  onChange,
  placeholder,
  hint,
  error,
  disabled,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}) {
  const id = `f-${name}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        aria-invalid={!!error}
        disabled={disabled}
      />
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function FieldArea({
  label,
  name,
  defaultValue,
  rows,
  maxLength,
  error,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  maxLength?: number;
  error?: string;
  disabled?: boolean;
}) {
  const id = `f-${name}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <Textarea
        id={id}
        name={name}
        rows={rows}
        maxLength={maxLength}
        defaultValue={defaultValue}
        aria-invalid={!!error}
        disabled={disabled}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  const id = `f-${name}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm disabled:opacity-50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
