import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { getCategoryBySlug } from "@/server/queries/categories";
import { CourseStatus } from "@/generated/prisma/enums";

export const alt = "Kategoria kursów na coursed.pl";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function CategoryOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  const name = category?.name ?? "Kategoria";

  const childSlugs = category?.children.map((c) => c.slug) ?? [];
  const slugsToCount = category ? [category.slug, ...childSlugs] : [];
  const courseCount = slugsToCount.length
    ? await db.course.count({
        where: {
          status: CourseStatus.PUBLISHED,
          categories: { some: { category: { slug: { in: slugsToCount } } } },
        },
      })
    : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            color: "#a1a1aa",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "#fde047",
            }}
          />
          coursed.pl
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "6px 14px",
              borderRadius: 999,
              background: "rgba(253, 224, 71, 0.15)",
              color: "#fde047",
              fontSize: 24,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Kategoria
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 80,
              lineHeight: 1.05,
              fontWeight: 700,
            }}
          >
            {truncate(name, 60)}
          </div>
          <div style={{ display: "flex", fontSize: 32, color: "#a1a1aa" }}>
            {courseCount > 0
              ? `${courseCount} ${courseLabel(courseCount)} z opiniami`
              : "Katalog opinii o kursach"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 28,
            color: "#a1a1aa",
          }}
        >
          <div style={{ display: "flex" }}>Opinie i oceny kursów</div>
          <div style={{ display: "flex", color: "#fde047", fontWeight: 600 }}>
            coursed.pl/kategoria
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}

function courseLabel(n: number) {
  if (n === 1) return "kurs";
  if (n >= 2 && n <= 4) return "kursy";
  return "kursów";
}
