import { getCourseEmbed, parseCachedRatings } from "@/server/queries/courses";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const course = await getCourseEmbed(slug);

  if (!course) {
    return Response.json(
      { error: "not_found" },
      { status: 404, headers: corsHeaders },
    );
  }

  const ratings = parseCachedRatings(course.cachedRatings);

  return Response.json(
    {
      slug: course.slug,
      title: course.title,
      url: absoluteUrl(`/kursy/${course.slug}`),
      overall: ratings?.overall ?? null,
      userAvg: ratings?.user.avg ?? null,
      criticAvg: ratings?.critic.avg ?? null,
      ratingsCount: course.ratingsCount,
    },
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
