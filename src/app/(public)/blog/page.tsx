import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { listPublishedBlogPosts } from "@/server/queries/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Poradniki, zestawienia i recenzje redakcji coursed.pl — jak wybierać kursy i nie dać się wciągnąć w marketing.",
};

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default async function BlogPage() {
  const posts = await listPublishedBlogPosts(50);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
        <p className="text-muted-foreground">
          Poradniki i zestawienia redakcji o ocenianiu i wybieraniu kursów.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          Jeszcze nic nie opublikowaliśmy. Wkrótce.
        </div>
      ) : (
        <ul className="space-y-6">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/blog/${p.slug}`}
                className="group flex gap-5 rounded-lg border border-border p-4 transition-colors hover:border-foreground/40"
              >
                {p.coverUrl && (
                  <div className="relative hidden h-28 w-44 shrink-0 overflow-hidden rounded-md bg-muted sm:block">
                    <Image
                      src={p.coverUrl}
                      alt=""
                      fill
                      sizes="176px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <h2 className="text-lg font-semibold leading-tight tracking-tight group-hover:underline underline-offset-4">
                    {p.title}
                  </h2>
                  {p.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {p.author.name && <span>{p.author.name} · </span>}
                    {p.publishedAt && (
                      <time dateTime={p.publishedAt.toISOString()}>
                        {dateFormatter.format(p.publishedAt)}
                      </time>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
