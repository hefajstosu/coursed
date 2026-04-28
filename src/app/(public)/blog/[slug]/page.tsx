import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/server/queries/blog";
import { Markdown } from "@/lib/markdown";

type PageProps = { params: Promise<{ slug: string }> };

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Wpis nie istnieje" };

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverUrl ? [{ url: post.coverUrl }] : undefined,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.author.name ? [post.author.name] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.coverUrl ?? undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: post.author.name ? { "@type": "Person", name: post.author.name } : undefined,
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-sm">
        <Link
          href="/blog"
          className="text-muted-foreground hover:text-foreground"
        >
          ← Wszystkie wpisy
        </Link>
      </nav>

      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{post.title}</h1>
        {post.excerpt && (
          <p className="text-lg text-muted-foreground">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {post.author.name && <span>{post.author.name}</span>}
          {post.publishedAt && (
            <>
              <span>·</span>
              <time dateTime={post.publishedAt.toISOString()}>
                {dateFormatter.format(post.publishedAt)}
              </time>
            </>
          )}
        </div>
      </header>

      {post.coverUrl && (
        <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-muted">
          <Image
            src={post.coverUrl}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}

      <Markdown source={post.content} className="text-base" />
    </article>
  );
}
