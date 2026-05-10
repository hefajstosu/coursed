import { ImageResponse } from "next/og";
import { getCourseBySlug, parseCachedRatings } from "@/server/queries/courses";
import { formatLabels } from "@/lib/format";

export const alt = "Karta kursu na coursed.pl";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function CourseOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  const title = course?.title ?? "coursed.pl";
  const ratings = course ? parseCachedRatings(course.cachedRatings) : null;
  const overall = ratings?.overall;
  const formatLabel = course ? formatLabels[course.format] : null;
  const platform = course?.platformName ?? course?.authorName ?? null;

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
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, color: "#a1a1aa" }}>
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
          {formatLabel && (
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
              {formatLabel}
            </div>
          )}
          <div
            style={{
              display: "flex",
              fontSize: 72,
              lineHeight: 1.1,
              fontWeight: 700,
              maxWidth: "100%",
            }}
          >
            {truncate(title, 90)}
          </div>
          {platform && (
            <div style={{ display: "flex", fontSize: 30, color: "#a1a1aa" }}>
              {truncate(platform, 60)}
            </div>
          )}
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
          {typeof overall === "number" ? (
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                color: "#fafafa",
              }}
            >
              <span style={{ fontSize: 88, fontWeight: 700, color: "#fde047" }}>
                {overall.toFixed(1)}
              </span>
              <span style={{ fontSize: 32, color: "#a1a1aa" }}>/ 10</span>
            </div>
          ) : (
            <div style={{ display: "flex", color: "#a1a1aa" }}>Brak ocen</div>
          )}
          <div style={{ display: "flex" }}>Opinie i oceny kursów</div>
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
