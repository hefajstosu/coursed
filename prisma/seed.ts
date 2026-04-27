import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  UserRole,
  CourseFormat,
  CourseStatus,
  CourseLevel,
  ContentKind,
  BlogPostStatus,
} from "../src/generated/prisma/enums";
import { computeRatings } from "../src/lib/ratings";

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (url.startsWith("prisma+")) {
    return new PrismaClient({ accelerateUrl: url });
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

const db = createClient();

// ──────────────────────────────────────────────────────────────────────────
// Dane demo
// ──────────────────────────────────────────────────────────────────────────

const USERS = [
  {
    email: "alice@coursed.pl",
    name: "Alicja Nowak",
    role: UserRole.USER,
  },
  {
    email: "bartek.user@coursed.pl",
    name: "Bartek Wójcik",
    role: UserRole.USER,
  },
  {
    email: "krytyk@coursed.pl",
    name: "Krzysztof Krytyk",
    role: UserRole.CRITIC,
  },
  {
    email: "redakcja@coursed.pl",
    name: "Redakcja coursed.pl",
    role: UserRole.CRITIC,
  },
  {
    email: "admin@coursed.pl",
    name: "Admin",
    role: UserRole.ADMIN,
  },
] as const;

const CATEGORIES: Array<{
  slug: string;
  name: string;
  description?: string;
  children?: Array<{ slug: string; name: string; description?: string }>;
}> = [
  {
    slug: "programowanie",
    name: "Programowanie",
    description: "Kursy programistyczne — frontend, backend, AI/ML, mobile.",
    children: [
      { slug: "frontend", name: "Frontend", description: "React, Vue, Next.js, JavaScript." },
      { slug: "backend", name: "Backend", description: "Node.js, Python, Go, bazy danych." },
      { slug: "ai-ml", name: "AI / ML", description: "Machine learning, data science, LLM-y." },
    ],
  },
  {
    slug: "biznes",
    name: "Biznes",
    description: "Kursy biznesowe — marketing, sprzedaż, negocjacje, zarządzanie.",
  },
  {
    slug: "jezyki",
    name: "Języki",
    description: "Kursy językowe online i stacjonarne.",
  },
  {
    slug: "matura-i-nauka",
    name: "Matura i nauka",
    description: "Kursy maturalne i akademickie.",
  },
  {
    slug: "kryptowaluty-i-finanse",
    name: "Kryptowaluty i finanse",
    description: "Inwestowanie, blockchain, tradycyjne finanse osobiste.",
  },
];

type CourseSeed = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  authorName: string;
  platformName: string;
  officialUrl?: string;
  priceModel?: string;
  language?: string;
  level?: (typeof CourseLevel)[keyof typeof CourseLevel];
  format: (typeof CourseFormat)[keyof typeof CourseFormat];
  hasCertificate?: boolean;
  location?: string;
  categorySlugs: string[];
  ratings: Array<{ userEmail: string; value: number }>; // 0..10
  reviews: Array<{ userEmail: string; body: string }>;
};

const COURSES: CourseSeed[] = [
  {
    slug: "kompletny-kurs-reacta",
    title: "Kompletny kurs Reacta od podstaw",
    shortDescription: "React 19, hooki, Next.js, Server Components — od zera do projektu produkcyjnego.",
    description:
      "Kurs prowadzi przez budowę pełnej aplikacji w React 19 + Next.js. Obejmuje hooki, zarządzanie stanem, formularze, autentykację i testowanie.",
    authorName: "Jan Kowalski",
    platformName: "Udemy",
    officialUrl: "https://example.com/react",
    priceModel: "169 PLN",
    language: "pl",
    level: CourseLevel.BEGINNER,
    format: CourseFormat.ONLINE,
    hasCertificate: true,
    categorySlugs: ["frontend"],
    ratings: [
      { userEmail: "alice@coursed.pl", value: 9 },
      { userEmail: "bartek.user@coursed.pl", value: 8 },
      { userEmail: "krytyk@coursed.pl", value: 8 },
      { userEmail: "redakcja@coursed.pl", value: 9 },
    ],
    reviews: [
      {
        userEmail: "alice@coursed.pl",
        body: "Bardzo dobry kurs dla początkujących. Czytelne tłumaczenia i dużo praktyki.",
      },
      {
        userEmail: "krytyk@coursed.pl",
        body: "Solidny materiał, choć w paru miejscach API React 19 wymaga aktualizacji nagrań.",
      },
    ],
  },
  {
    slug: "backend-node-typescript",
    title: "Backend w Node.js i TypeScript",
    shortDescription: "Architektura, REST, gRPC, kolejki, Postgres + Prisma.",
    description:
      "Praktyczny kurs budowy skalowalnego backendu — od warstwy HTTP po obserwowalność i deploy.",
    authorName: "Maria Lis",
    platformName: "Coursera",
    priceModel: "PAID",
    language: "pl",
    level: CourseLevel.INTERMEDIATE,
    format: CourseFormat.ONLINE,
    hasCertificate: true,
    categorySlugs: ["backend"],
    ratings: [
      { userEmail: "bartek.user@coursed.pl", value: 9 },
      { userEmail: "alice@coursed.pl", value: 8 },
      { userEmail: "krytyk@coursed.pl", value: 9 },
    ],
    reviews: [
      {
        userEmail: "bartek.user@coursed.pl",
        body: "Najlepszy kurs backendowy po polsku jaki widziałem. Świetne case studies.",
      },
    ],
  },
  {
    slug: "python-data-science",
    title: "Praktyczny kurs Pythona dla data science",
    shortDescription: "Pandas, NumPy, scikit-learn, podstawy ML — z prawdziwymi datasetami.",
    description:
      "Kurs prowadzony w Jupyterze. Każdy moduł kończy się projektem z realnym datasetem.",
    authorName: "Tomasz Wiśniewski",
    platformName: "DataCamp",
    priceModel: "FREEMIUM",
    language: "en",
    level: CourseLevel.INTERMEDIATE,
    format: CourseFormat.ONLINE,
    categorySlugs: ["ai-ml"],
    ratings: [
      { userEmail: "alice@coursed.pl", value: 7 },
      { userEmail: "redakcja@coursed.pl", value: 8 },
    ],
    reviews: [
      {
        userEmail: "redakcja@coursed.pl",
        body: "Dobry start dla osób z podstawami Pythona. Brakuje sekcji o deepie learningu.",
      },
    ],
  },
  {
    slug: "negocjacje-biznesowe-warszawa",
    title: "Negocjacje biznesowe — warsztaty stacjonarne",
    shortDescription: "Dwudniowe warsztaty w Warszawie z elementami symulacji negocjacyjnych.",
    description:
      "Praktyczne warsztaty negocjacji prowadzone przez doświadczonych mediatorów. Mała grupa, dużo case studies.",
    authorName: "Szkoła Negocjacji",
    platformName: "Szkoła Negocjacji",
    priceModel: "2400 PLN",
    language: "pl",
    level: CourseLevel.ADVANCED,
    format: CourseFormat.OFFLINE,
    location: "Warszawa, ul. Marszałkowska 100",
    categorySlugs: ["biznes"],
    ratings: [{ userEmail: "krytyk@coursed.pl", value: 9 }],
    reviews: [
      {
        userEmail: "krytyk@coursed.pl",
        body: "Najwyższa półka warsztatów — prowadzący z realnym doświadczeniem korporacyjnym.",
      },
    ],
  },
  {
    slug: "angielski-biznesowy-b2-c1",
    title: "Angielski biznesowy B2 → C1",
    shortDescription: "Kurs dla osób średniozaawansowanych — prezentacje, negocjacje, e-maile.",
    description:
      "12 modułów po 4 godziny. Każdy moduł zawiera nagrania, fiszki, ćwiczenia mówione i pisemne.",
    authorName: "Anna Lewandowska",
    platformName: "eTutor",
    priceModel: "299 PLN/m",
    language: "pl",
    level: CourseLevel.INTERMEDIATE,
    format: CourseFormat.ONLINE,
    hasCertificate: true,
    categorySlugs: ["jezyki"],
    ratings: [
      { userEmail: "alice@coursed.pl", value: 8 },
      { userEmail: "bartek.user@coursed.pl", value: 7 },
      { userEmail: "redakcja@coursed.pl", value: 7 },
    ],
    reviews: [
      {
        userEmail: "alice@coursed.pl",
        body: "Porządny kurs, ale brakuje mi więcej rozmów na żywo z native speakerami.",
      },
    ],
  },
  {
    slug: "hiszpanski-od-zera",
    title: "Hiszpański od zera",
    shortDescription: "Kurs dla początkujących — A1 do A2 w 3 miesiące.",
    description: "Lekcje 15-minutowe + ćwiczenia powtarzalne metodą spaced repetition.",
    authorName: "Carlos Garcia",
    platformName: "Preply",
    priceModel: "FREE",
    language: "pl",
    level: CourseLevel.BEGINNER,
    format: CourseFormat.ONLINE,
    categorySlugs: ["jezyki"],
    ratings: [{ userEmail: "alice@coursed.pl", value: 6 }],
    reviews: [],
  },
  {
    slug: "matura-matematyka-pelny",
    title: "Matura z matematyki — pełny kurs",
    shortDescription: "Wszystkie działy z poziomu podstawowego i rozszerzonego — z arkuszami CKE.",
    description:
      "Kurs prowadzony przez egzaminatora maturalnego. Każdy dział kończy się próbnym arkuszem.",
    authorName: "Piotr Nowak",
    platformName: "Matura.pl",
    priceModel: "499 PLN",
    language: "pl",
    level: CourseLevel.BEGINNER,
    format: CourseFormat.ONLINE,
    categorySlugs: ["matura-i-nauka"],
    ratings: [
      { userEmail: "alice@coursed.pl", value: 9 },
      { userEmail: "bartek.user@coursed.pl", value: 9 },
      { userEmail: "krytyk@coursed.pl", value: 8 },
      { userEmail: "redakcja@coursed.pl", value: 9 },
    ],
    reviews: [
      {
        userEmail: "redakcja@coursed.pl",
        body: "Najlepszy ogólnodostępny kurs maturalny — szczegółowo omówione typy zadań.",
      },
    ],
  },
  {
    slug: "inwestowanie-fundamenty",
    title: "Inwestowanie na giełdzie — fundamenty",
    shortDescription: "Akcje, ETF-y, IKE/IKZE, podstawy analizy fundamentalnej.",
    description: "10 modułów. Bez konkretnych rekomendacji inwestycyjnych — czysta edukacja.",
    authorName: "Marek Bogucki",
    platformName: "Strefa Inwestorów",
    priceModel: "799 PLN",
    language: "pl",
    level: CourseLevel.BEGINNER,
    format: CourseFormat.ONLINE,
    categorySlugs: ["kryptowaluty-i-finanse"],
    ratings: [{ userEmail: "bartek.user@coursed.pl", value: 7 }],
    reviews: [],
  },
  {
    slug: "bitcoin-blockchain-ekspercki",
    title: "Bitcoin i blockchain — kurs ekspercki",
    shortDescription: "Lightning Network, MEV, smart contracts, security.",
    description: "Kurs dla osób, które rozumieją podstawy. Dużo materiału po angielsku.",
    authorName: "Krzysztof Mazur",
    platformName: "BitcoinAcademy",
    priceModel: "1200 PLN",
    language: "pl",
    level: CourseLevel.ADVANCED,
    format: CourseFormat.ONLINE,
    categorySlugs: ["kryptowaluty-i-finanse"],
    ratings: [
      { userEmail: "krytyk@coursed.pl", value: 9 },
      { userEmail: "redakcja@coursed.pl", value: 8 },
    ],
    reviews: [
      {
        userEmail: "krytyk@coursed.pl",
        body: "Zaawansowany, ale dobrze ułożony. Wymagana wcześniejsza znajomość kryptografii.",
      },
    ],
  },
  {
    slug: "marketing-internetowy-30-dni",
    title: "Marketing internetowy w 30 dni",
    shortDescription: "SEO, Google Ads, Meta Ads, content marketing — pakiet startowy.",
    description: "Kurs prowadzony przez praktyka z 10 lat doświadczenia w agencjach.",
    authorName: "Magdalena Kowalska",
    platformName: "Coursed Studio",
    priceModel: "349 PLN",
    language: "pl",
    level: CourseLevel.INTERMEDIATE,
    format: CourseFormat.ONLINE,
    categorySlugs: ["biznes"],
    ratings: [
      { userEmail: "alice@coursed.pl", value: 6 },
      { userEmail: "bartek.user@coursed.pl", value: 7 },
    ],
    reviews: [],
  },
];

// ──────────────────────────────────────────────────────────────────────────
// Seed
// ──────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("→ Seeding users…");
  for (const u of USERS) {
    await db.user.upsert({
      where: { email: u.email },
      create: { email: u.email, name: u.name, role: u.role, emailVerified: new Date() },
      update: { name: u.name, role: u.role },
    });
  }

  console.log("→ Seeding categories…");
  for (const c of CATEGORIES) {
    const parent = await db.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, name: c.name, description: c.description },
      update: { name: c.name, description: c.description },
    });
    for (const child of c.children ?? []) {
      await db.category.upsert({
        where: { slug: child.slug },
        create: {
          slug: child.slug,
          name: child.name,
          description: child.description,
          parentId: parent.id,
        },
        update: {
          name: child.name,
          description: child.description,
          parentId: parent.id,
        },
      });
    }
  }

  const usersByEmail = new Map(
    (await db.user.findMany({ where: { email: { in: USERS.map((u) => u.email) } } })).map((u) => [u.email, u]),
  );
  const categoriesBySlug = new Map(
    (await db.category.findMany()).map((c) => [c.slug, c]),
  );

  console.log("→ Seeding courses…");
  for (const c of COURSES) {
    const course = await db.course.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        title: c.title,
        shortDescription: c.shortDescription,
        description: c.description,
        authorName: c.authorName,
        platformName: c.platformName,
        officialUrl: c.officialUrl,
        priceModel: c.priceModel,
        language: c.language,
        level: c.level,
        format: c.format,
        hasCertificate: c.hasCertificate ?? false,
        location: c.location,
        status: CourseStatus.PUBLISHED,
      },
      update: {
        title: c.title,
        shortDescription: c.shortDescription,
        description: c.description,
        authorName: c.authorName,
        platformName: c.platformName,
        officialUrl: c.officialUrl,
        priceModel: c.priceModel,
        language: c.language,
        level: c.level,
        format: c.format,
        hasCertificate: c.hasCertificate ?? false,
        location: c.location,
        status: CourseStatus.PUBLISHED,
      },
    });

    // Reset relations for idempotent seed
    await db.courseCategory.deleteMany({ where: { courseId: course.id } });
    await db.rating.deleteMany({ where: { courseId: course.id } });
    await db.review.deleteMany({ where: { courseId: course.id } });

    for (const slug of c.categorySlugs) {
      const cat = categoriesBySlug.get(slug);
      if (!cat) throw new Error(`Brak kategorii: ${slug}`);
      await db.courseCategory.create({
        data: { courseId: course.id, categoryId: cat.id },
      });
    }

    for (const r of c.ratings) {
      const user = usersByEmail.get(r.userEmail);
      if (!user) throw new Error(`Brak usera: ${r.userEmail}`);
      await db.rating.create({
        data: {
          courseId: course.id,
          userId: user.id,
          value: r.value,
          kind:
            user.role === UserRole.CRITIC || user.role === UserRole.EDITOR
              ? ContentKind.CRITIC
              : ContentKind.USER,
        },
      });
    }

    for (const rv of c.reviews) {
      const user = usersByEmail.get(rv.userEmail);
      if (!user) throw new Error(`Brak usera: ${rv.userEmail}`);
      await db.review.create({
        data: {
          courseId: course.id,
          userId: user.id,
          body: rv.body,
          kind:
            user.role === UserRole.CRITIC || user.role === UserRole.EDITOR
              ? ContentKind.CRITIC
              : ContentKind.USER,
        },
      });
    }

    // Cache aggregated ratings
    const userValues = c.ratings
      .filter((r) => {
        const u = usersByEmail.get(r.userEmail);
        return u?.role === UserRole.USER;
      })
      .map((r) => r.value);
    const criticValues = c.ratings
      .filter((r) => {
        const u = usersByEmail.get(r.userEmail);
        return u?.role === UserRole.CRITIC || u?.role === UserRole.EDITOR;
      })
      .map((r) => r.value);

    const cached = computeRatings({ userValues, criticValues });
    await db.course.update({
      where: { id: course.id },
      data: { cachedRatings: cached },
    });
  }

  console.log("→ Seeding blog posts…");
  const editor = usersByEmail.get("redakcja@coursed.pl")!;
  await db.blogPost.upsert({
    where: { slug: "jak-wybrac-dobry-kurs-online" },
    create: {
      slug: "jak-wybrac-dobry-kurs-online",
      title: "Jak wybrać dobry kurs online — 7 sygnałów jakości",
      excerpt: "Praktyczny przewodnik po ocenie kursów online — od programu, przez sylabus, po opinie.",
      content:
        "## Wstęp\n\nWybór kursu online to dziś loteria. W tym artykule opisujemy 7 sygnałów, które warto sprawdzić przed zakupem.",
      authorId: editor.id,
      status: BlogPostStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    update: {},
  });

  console.log("✓ Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
