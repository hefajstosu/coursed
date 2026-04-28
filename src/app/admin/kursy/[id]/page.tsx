import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-helpers";
import { CourseForm, type CourseFormDefaults } from "@/components/admin/CourseForm";
import { getAdminCourse, listFlatCategories } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const course = await getAdminCourse(id);
  return { title: course ? `Edytuj: ${course.title}` : "Kurs" };
}

export default async function EditCoursePage({ params }: PageProps) {
  const actor = await requireRole("ADMIN", "EDITOR");
  const { id } = await params;
  const [course, categories] = await Promise.all([
    getAdminCourse(id),
    listFlatCategories(),
  ]);
  if (!course) notFound();

  const defaults: CourseFormDefaults = {
    title: course.title,
    slug: course.slug,
    shortDescription: course.shortDescription ?? "",
    description: course.description ?? "",
    coverUrl: course.coverUrl ?? "",
    authorName: course.authorName ?? "",
    platformName: course.platformName ?? "",
    officialUrl: course.officialUrl ?? "",
    priceModel: course.priceModel ?? "",
    language: course.language ?? "",
    level: course.level ?? "",
    format: course.format,
    hasCertificate: course.hasCertificate,
    location: course.location ?? "",
    status: course.status === "MERGED" ? "DRAFT" : course.status,
    categoryIds: course.categories.map((c) => c.categoryId),
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edytuj kurs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <Link
              href={`/kursy/${course.slug}`}
              target="_blank"
              className="hover:underline"
            >
              /kursy/{course.slug} ↗
            </Link>
          </p>
        </div>
        {course.status === "MERGED" && (
          <span className="rounded bg-muted px-2 py-1 text-xs">Scalony</span>
        )}
      </header>
      <CourseForm
        mode="edit"
        courseId={course.id}
        defaults={defaults}
        categories={categories}
        canDelete={actor.role === "ADMIN"}
      />
    </div>
  );
}
