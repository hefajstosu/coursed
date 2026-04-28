"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { value: string; label: string };

type Props = {
  categories: Option[];
  formats: Option[];
  languages: Option[];
  levels: Option[];
  sorts: Option[];
};

const ALL = "__all__";

export function CourseFilters({ categories, formats, languages, levels, sorts }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value && value !== ALL) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    });
  };

  const get = (key: string) => searchParams.get(key) ?? ALL;

  return (
    <div
      className={`grid grid-cols-2 lg:grid-cols-5 gap-3 ${isPending ? "opacity-60" : ""}`}
    >
      <Filter
        label="Kategoria"
        value={get("category")}
        options={categories}
        onChange={(v) => setParam("category", v)}
      />
      <Filter
        label="Forma"
        value={get("format")}
        options={formats}
        onChange={(v) => setParam("format", v)}
      />
      <Filter
        label="Język"
        value={get("language")}
        options={languages}
        onChange={(v) => setParam("language", v)}
      />
      <Filter
        label="Poziom"
        value={get("level")}
        options={levels}
        onChange={(v) => setParam("level", v)}
      />
      <Filter
        label="Sortowanie"
        value={searchParams.get("sort") ?? sorts[0]?.value ?? ALL}
        options={sorts}
        onChange={(v) => setParam("sort", v === sorts[0]?.value ? null : v)}
        allowAll={false}
      />
    </div>
  );
}

function Filter({
  label,
  value,
  options,
  onChange,
  allowAll = true,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  allowAll?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={(v) => onChange(v ?? ALL)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowAll && <SelectItem value={ALL}>Wszystkie</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
