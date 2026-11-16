import type { Metadata } from "next";
import { CourseForm, type CourseFormDefaults } from "@/components/admin/CourseForm";
import { listFlatCategories } from "@/server/queries/admin";
import { requireRole } from "@/lib/auth-helpers";

export const metadata: Metadata = { title: "Nowy kurs" };
export const dynamic = "force-dynamic";

const empty: CourseFormDefaults = {
  title: "",
  slug: "",
  shortDescription: "",
  description: "",
  coverUrl: "",
  authorName: "",
  platformName: "",
  officialUrl: "",
  priceModel: "",
  language: "",
  level: "",
  format: "ONLINE",
  hasCertificate: false,
  location: "",
  status: "DRAFT",
  categoryIds: [],
};

export default async function NewCoursePage() {
  await requireRole("ADMIN", "EDITOR");
  const categories = await listFlatCategories();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Nowy kurs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Wypełnij dane i zapisz jako wersję roboczą lub od razu opublikuj.
        </p>
      </header>
      <CourseForm mode="create" defaults={empty} categories={categories} />
    </div>
  );
}
