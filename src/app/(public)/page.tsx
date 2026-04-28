import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CourseCard } from "@/components/course/CourseCard";
import { getFeaturedCourses, getRecentCourses } from "@/server/queries/courses";
import { getPopularCategories } from "@/server/queries/categories";

export default async function HomePage() {
  const [featured, recent, popularCategories] = await Promise.all([
    getFeaturedCourses(6),
    getRecentCourses(6),
    getPopularCategories(8),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-16">
      <section className="space-y-5 py-8">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight max-w-3xl">
          Niezależne opinie o kursach online i offline.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          coursed.pl agreguje oceny użytkowników i krytyków. Sprawdź, czy kurs, który Cię
          interesuje, jest naprawdę wart swojej ceny.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/kursy" className={cn(buttonVariants({ size: "lg" }))}>
            Przeglądaj kursy
          </Link>
          <Link
            href="/zglos-kurs"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            Zgłoś kurs
          </Link>
        </div>
      </section>

      {featured.length > 0 && (
        <Section
          title="Najwyżej oceniane"
          subtitle="Kursy z najwyższymi ocenami społeczności i krytyków."
          link={{ href: "/kursy?sort=top-rated", label: "Zobacz wszystkie" }}
        >
          <CourseGrid courses={featured} />
        </Section>
      )}

      {popularCategories.length > 0 && (
        <Section
          title="Popularne kategorie"
          subtitle="Najczęściej przeglądane obszary tematyczne."
        >
          <ul className="flex flex-wrap gap-2">
            {popularCategories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/kategoria/${c.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm hover:border-foreground/40"
                >
                  {c.name}
                  <span className="text-xs text-muted-foreground">
                    {c._count.courses}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {recent.length > 0 && (
        <Section
          title="Ostatnio dodane"
          subtitle="Świeżo zindeksowane kursy."
          link={{ href: "/kursy", label: "Zobacz wszystkie" }}
        >
          <CourseGrid courses={recent} />
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  link,
  children,
}: {
  title: string;
  subtitle?: string;
  link?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {link && (
          <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground shrink-0">
            {link.label} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function CourseGrid({
  courses,
}: {
  courses: Awaited<ReturnType<typeof getFeaturedCourses>>;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((c) => (
        <CourseCard key={c.id} course={c} />
      ))}
    </div>
  );
}
