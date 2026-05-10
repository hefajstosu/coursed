import { ImageResponse } from "next/og";
import { getBlogPostBySlug } from "@/server/queries/blog";

export const alt = "Wpis blogowy na coursed.pl";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default async function BlogOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  const title = post?.title ?? "Blog · coursed.pl";
  const author = post?.author.name ?? null;
  const date = post?.publishedAt ? dateFormatter.format(post.publishedAt) : null;

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
          coursed.pl · Blog
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              lineHeight: 1.15,
              fontWeight: 700,
              maxWidth: "100%",
            }}
          >
            {truncate(title, 110)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 28,
            color: "#a1a1aa",
          }}
        >
          {author && <span style={{ display: "flex" }}>{author}</span>}
          {author && date && <span style={{ display: "flex" }}>·</span>}
          {date && <span style={{ display: "flex" }}>{date}</span>}
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
