"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitCourseRequest, type CourseRequestState } from "@/server/actions/requests";

const initialState: CourseRequestState = {};

export function CourseRequestForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, action, pending] = useActionState(submitCourseRequest, initialState);

  if (state.ok) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm">
        <h2 className="text-base font-semibold">Dziękujemy za zgłoszenie.</h2>
        <p className="mt-2 text-muted-foreground">
          Redakcja przejrzy zgłoszenie i opublikuje kurs po weryfikacji.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {/* honeypot — niewidoczne pole. Boty wypełniają wszystko, ludzie nie widzą. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Nie wypełniaj tego pola
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Field
        label="Tytuł kursu *"
        name="title"
        required
        placeholder="np. Kurs Python od podstaw"
        error={state.fieldErrors?.title}
        disabled={pending}
      />

      <Field
        label="Link do kursu"
        name="url"
        type="url"
        placeholder="https://platforma.pl/kurs/..."
        error={state.fieldErrors?.url}
        disabled={pending}
        hint="Oficjalna strona kursu lub strona sprzedaży."
      />

      <Field
        label="Twój email"
        name="email"
        type="email"
        placeholder="ty@example.com"
        defaultValue={defaultEmail}
        error={state.fieldErrors?.email}
        disabled={pending}
        hint="Skontaktujemy się, jeśli będziemy potrzebować dodatkowych informacji."
      />

      <div className="space-y-1.5">
        <Label htmlFor="note" className="text-sm">
          Dodatkowe informacje
        </Label>
        <Textarea
          id="note"
          name="note"
          rows={4}
          placeholder="Krótko: kto prowadzi, dla kogo jest kurs, czemu warto."
          aria-invalid={!!state.fieldErrors?.note}
          disabled={pending}
        />
        {state.fieldErrors?.note && (
          <p className="text-xs text-destructive">{state.fieldErrors.note}</p>
        )}
      </div>

      <label className="flex items-start gap-2.5 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          name="isCreator"
          disabled={pending}
          className="mt-0.5 size-4 shrink-0 rounded border border-input bg-transparent accent-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span>
          Jestem twórcą kursu
          <span className="block text-xs text-muted-foreground mt-0.5">
            Zaznacz, jeśli zgłaszasz własny kurs — redakcja może poprosić o weryfikację.
          </span>
        </span>
      </label>

      {state.error && !state.fieldErrors && (
        <p className="text-sm text-destructive" aria-live="polite">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Wysyłam…" : "Wyślij zgłoszenie"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
  hint,
  error,
  disabled,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-sm">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
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
