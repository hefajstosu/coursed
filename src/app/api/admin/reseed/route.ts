// TYMCZASOWY endpoint reseedujący katalog kursów na produkcji.
// Zabezpieczony nagłówkiem `x-reseed-token` == process.env.RESEED_TOKEN.
// Po jednorazowym użyciu ten plik oraz zmienna RESEED_TOKEN są usuwane.
import { db } from "@/lib/db";
import { computeRatings } from "@/lib/ratings";
import {
  UserRole,
  CourseFormat,
  CourseStatus,
  CourseLevel,
  ContentKind,
} from "@/generated/prisma/enums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const IMG = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const USERS = [
  { email: "ola.demo@coursed.pl", name: "Ola Zielińska", role: UserRole.USER },
  { email: "michal.demo@coursed.pl", name: "Michał Kowalczyk", role: UserRole.USER },
  { email: "kasia.demo@coursed.pl", name: "Kasia Wiśniewska", role: UserRole.USER },
  { email: "piotr.demo@coursed.pl", name: "Piotr Adamski", role: UserRole.USER },
  { email: "ania.demo@coursed.pl", name: "Ania Lewicka", role: UserRole.USER },
  { email: "tomek.demo@coursed.pl", name: "Tomek Zając", role: UserRole.USER },
  { email: "krytyk.demo@coursed.pl", name: "Redakcja coursed.pl", role: UserRole.CRITIC },
] as const;

const USER_EMAILS = USERS.filter((u) => u.role === UserRole.USER).map((u) => u.email);
const CRITIC_EMAIL = "krytyk.demo@coursed.pl";

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
  { slug: "biznes", name: "Biznes", description: "Marketing, sprzedaż, negocjacje, zarządzanie." },
  { slug: "jezyki", name: "Języki", description: "Kursy językowe online i stacjonarne." },
  { slug: "matura-i-nauka", name: "Matura i nauka", description: "Kursy maturalne i akademickie." },
  {
    slug: "kryptowaluty-i-finanse",
    name: "Kryptowaluty i finanse",
    description: "Inwestowanie, blockchain, finanse osobiste.",
  },
];

const REVIEW_TEXTS = [
  "Konkretny, poukładany materiał. Widać, że prowadzący zna temat od praktycznej strony.",
  "Bardzo dobre tempo i mnóstwo przykładów. Poleciłbym każdemu, kto zaczyna.",
  "Świetnie wytłumaczone podstawy, a projekt końcowy realnie utrwala wiedzę.",
  "Solidny kurs, choć kilka nagrań przydałoby się odświeżyć. Mimo to warto.",
  "Najlepiej wydane pieniądze w tym roku. Wracam do materiałów co jakiś czas.",
  "Prowadzący tłumaczy jasno i bez lania wody. Ćwiczenia mają sens.",
  "Dużo praktyki, mało teorii dla samej teorii — dokładnie tak, jak lubię.",
  "Poziom trudności dobrze dobrany, wsparcie w komentarzach na plus.",
  "Materiał aktualny i dobrze zorganizowany. Certyfikat na koniec to miły dodatek.",
  "Kilka tematów potraktowanych skrótowo, ale całość spójna i wartościowa.",
  "Świetny wstęp do tematu — po kursie czułem, że wiem, co robić dalej.",
  "Rzetelnie przygotowane. Notatki i materiały dodatkowe bardzo pomocne.",
];

type CourseSeed = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  authorName: string;
  platformName: string;
  priceModel: string;
  language: string;
  level: (typeof CourseLevel)[keyof typeof CourseLevel];
  format: (typeof CourseFormat)[keyof typeof CourseFormat];
  hasCertificate: boolean;
  categorySlugs: string[];
  coverUrl: string;
};

const COURSES: CourseSeed[] = [
  { slug: "vue-3-od-podstaw", title: "Vue 3 od podstaw", shortDescription: "Composition API, reaktywność, Pinia i routing — kompletny wstęp do Vue 3.", description: "Praktyczny kurs Vue 3 z budową aplikacji SPA od zera. Composition API, komponenty, Pinia, Vue Router i integracja z API.", authorName: "Jan Kowalski", platformName: "Udemy", priceModel: "199 PLN", language: "pl", level: CourseLevel.BEGINNER, format: CourseFormat.ONLINE, hasCertificate: true, categorySlugs: ["frontend"], coverUrl: IMG("1461749280684-dccba630e2f6") },
  { slug: "typescript-zaawansowany", title: "TypeScript zaawansowany", shortDescription: "Typy generyczne, conditional types, mapped types i wzorce w dużych projektach.", description: "Kurs dla programistów, którzy znają podstawy TS. Zaawansowany system typów, utility types, inferencja i bezpieczne API.", authorName: "Maria Lis", platformName: "Frontend Masters", priceModel: "PAID", language: "pl", level: CourseLevel.ADVANCED, format: CourseFormat.ONLINE, hasCertificate: true, categorySlugs: ["frontend"], coverUrl: IMG("1498050108023-c5249f4df085") },
  { slug: "nextjs-16-app-router", title: "Next.js 16 — App Router w praktyce", shortDescription: "Server Components, Server Actions, cache i deploy na Vercel.", description: "Budowa produkcyjnej aplikacji w Next.js 16. App Router, RSC, Server Actions, strategie cache'owania i wdrożenie.", authorName: "Tomasz Wiśniewski", platformName: "Coursed Studio", priceModel: "249 PLN", language: "pl", level: CourseLevel.INTERMEDIATE, format: CourseFormat.ONLINE, hasCertificate: true, categorySlugs: ["frontend"], coverUrl: IMG("1517180102446-f3ece451e9d8") },
  { slug: "go-dla-backend-developerow", title: "Go dla backend developerów", shortDescription: "Goroutines, kanały, HTTP API i mikroserwisy w Go.", description: "Praktyczny kurs języka Go w zastosowaniach backendowych. Concurrency, testy, budowa REST API i mikroserwisów.", authorName: "Marek Bogucki", platformName: "Coursera", priceModel: "PAID", language: "pl", level: CourseLevel.INTERMEDIATE, format: CourseFormat.ONLINE, hasCertificate: true, categorySlugs: ["backend"], coverUrl: IMG("1555066931-4365d14bab8c") },
  { slug: "docker-kubernetes-od-zera", title: "Docker i Kubernetes od zera", shortDescription: "Konteneryzacja, obrazy, Compose i orkiestracja w K8s.", description: "Od pierwszego Dockerfile po działający klaster Kubernetes. Deploy, skalowanie, konfiguracja i dobre praktyki.", authorName: "Piotr Nowak", platformName: "Udemy", priceModel: "329 PLN", language: "pl", level: CourseLevel.INTERMEDIATE, format: CourseFormat.ONLINE, hasCertificate: true, categorySlugs: ["backend"], coverUrl: IMG("1526379095098-d400fd0bf935") },
  { slug: "postgresql-dla-programistow", title: "PostgreSQL dla programistów", shortDescription: "Indeksy, zapytania, transakcje i optymalizacja wydajności.", description: "Kompletny kurs PostgreSQL: modelowanie danych, indeksy, plany zapytań, transakcje i tuning wydajności.", authorName: "Anna Lewandowska", platformName: "DataCamp", priceModel: "FREEMIUM", language: "pl", level: CourseLevel.INTERMEDIATE, format: CourseFormat.ONLINE, hasCertificate: false, categorySlugs: ["backend"], coverUrl: IMG("1504384308090-c894fdcc538d") },
  { slug: "wprowadzenie-do-machine-learning", title: "Wprowadzenie do uczenia maszynowego", shortDescription: "Regresja, klasyfikacja, walidacja modeli — z scikit-learn.", description: "Solidny wstęp do ML: przygotowanie danych, modele nadzorowane, ocena i unikanie przeuczenia. Dużo praktyki w Pythonie.", authorName: "Tomasz Wiśniewski", platformName: "Coursera", priceModel: "FREEMIUM", language: "en", level: CourseLevel.BEGINNER, format: CourseFormat.ONLINE, hasCertificate: true, categorySlugs: ["ai-ml"], coverUrl: IMG("1516321318423-f06f85e504b3") },
  { slug: "deep-learning-pytorch", title: "Deep Learning z PyTorch", shortDescription: "Sieci neuronowe, CNN, RNN i trenowanie modeli na GPU.", description: "Praktyczny deep learning w PyTorch. Budowa i trenowanie sieci, transfer learning, praca z GPU i wdrożenie modeli.", authorName: "Maria Lis", platformName: "Udacity", priceModel: "1499 PLN", language: "en", level: CourseLevel.ADVANCED, format: CourseFormat.ONLINE, hasCertificate: true, categorySlugs: ["ai-ml"], coverUrl: IMG("1551288049-bebda4e38f71") },
  { slug: "llm-budowa-aplikacji-ai", title: "LLM-y i budowa aplikacji AI", shortDescription: "RAG, embeddingi, promptowanie i integracja z API modeli.", description: "Jak budować aplikacje oparte o duże modele językowe: RAG, wektory, orchestration, koszty i ewaluacja jakości.", authorName: "Krzysztof Mazur", platformName: "Coursed Studio", priceModel: "599 PLN", language: "pl", level: CourseLevel.INTERMEDIATE, format: CourseFormat.ONLINE, hasCertificate: true, categorySlugs: ["ai-ml"], coverUrl: IMG("1460925895917-afdab827c52f") },
  { slug: "scrum-agile-zarzadzanie-projektami", title: "Zarządzanie projektami — Scrum i Agile", shortDescription: "Role, ceremonie, backlog i praca zespołu w praktyce.", description: "Kurs zwinnego zarządzania projektami. Scrum, Kanban, planowanie, retrospektywy i realne studia przypadków.", authorName: "Magdalena Kowalska", platformName: "Coursera", priceModel: "399 PLN", language: "pl", level: CourseLevel.BEGINNER, format: CourseFormat.ONLINE, hasCertificate: true, categorySlugs: ["biznes"], coverUrl: IMG("1454165804606-c3d57bc86b40") },
  { slug: "sprzedaz-b2b-od-podstaw", title: "Sprzedaż B2B od podstaw", shortDescription: "Prospecting, lejek, negocjacje i domykanie transakcji.", description: "Praktyczny kurs sprzedaży B2B. Budowa lejka, kwalifikacja leadów, prowadzenie rozmów i negocjacje handlowe.", authorName: "Szkoła Sprzedaży", platformName: "Coursed Studio", priceModel: "449 PLN", language: "pl", level: CourseLevel.INTERMEDIATE, format: CourseFormat.ONLINE, hasCertificate: false, categorySlugs: ["biznes"], coverUrl: IMG("1552664730-d307ca884978") },
  { slug: "facebook-instagram-ads", title: "Facebook & Instagram Ads", shortDescription: "Kampanie, targetowanie, kreacje i optymalizacja ROAS.", description: "Kompletny kurs Meta Ads. Struktura kampanii, piksel, targetowanie, testy A/B i optymalizacja pod konwersje.", authorName: "Magdalena Kowalska", platformName: "Coursed Studio", priceModel: "349 PLN", language: "pl", level: CourseLevel.INTERMEDIATE, format: CourseFormat.ONLINE, hasCertificate: true, categorySlugs: ["biznes"], coverUrl: IMG("1533750349088-cd871a92f312") },
  { slug: "angielski-konwersacje-c1", title: "Angielski — konwersacje C1", shortDescription: "Płynność, idiomy i swobodne rozmowy na poziomie zaawansowanym.", description: "Kurs konwersacyjny dla poziomu C1. Idiomy, dyskusje tematyczne, wymowa i budowanie płynności wypowiedzi.", authorName: "Anna Lewandowska", platformName: "eTutor", priceModel: "299 PLN/m", language: "pl", level: CourseLevel.ADVANCED, format: CourseFormat.ONLINE, hasCertificate: true, categorySlugs: ["jezyki"], coverUrl: IMG("1543286386-713bdd548da4") },
  { slug: "niemiecki-od-zera-do-b1", title: "Niemiecki od zera do B1", shortDescription: "Gramatyka, słownictwo i konwersacje — A1 do B1.", description: "Kompletny kurs niemieckiego od podstaw do poziomu B1. Systematyczna gramatyka, słownictwo i ćwiczenia mówione.", authorName: "Carlos Garcia", platformName: "Preply", priceModel: "FREEMIUM", language: "pl", level: CourseLevel.BEGINNER, format: CourseFormat.ONLINE, hasCertificate: false, categorySlugs: ["jezyki"], coverUrl: IMG("1544716278-ca5e3f4abd8c") },
  { slug: "wloski-dla-podroznikow", title: "Włoski dla podróżników", shortDescription: "Praktyczne zwroty na wakacje — restauracja, hotel, zakupy.", description: "Ekspresowy kurs włoskiego dla podróżujących. Najważniejsze zwroty, wymowa i sytuacje z życia turysty.", authorName: "Carlos Garcia", platformName: "Preply", priceModel: "FREE", language: "pl", level: CourseLevel.BEGINNER, format: CourseFormat.ONLINE, hasCertificate: false, categorySlugs: ["jezyki"], coverUrl: IMG("1503676260728-1c00da094a0b") },
  { slug: "matura-jezyk-polski", title: "Matura z języka polskiego", shortDescription: "Rozprawka, lektury i interpretacja — poziom podstawowy.", description: "Kurs maturalny z polskiego. Lektury obowiązkowe, kompozycja rozprawki, interpretacja tekstów i ćwiczenia z arkuszami.", authorName: "Piotr Nowak", platformName: "Matura.pl", priceModel: "399 PLN", language: "pl", level: CourseLevel.BEGINNER, format: CourseFormat.ONLINE, hasCertificate: false, categorySlugs: ["matura-i-nauka"], coverUrl: IMG("1434030216411-0b793f4b4173") },
  { slug: "fizyka-maturalna-rozszerzona", title: "Fizyka maturalna — rozszerzona", shortDescription: "Mechanika, elektryczność, fale — z zadaniami CKE.", description: "Pełny kurs fizyki rozszerzonej. Każdy dział z teorią, przykładami i zadaniami maturalnymi z rozwiązaniami.", authorName: "Piotr Nowak", platformName: "Matura.pl", priceModel: "549 PLN", language: "pl", level: CourseLevel.ADVANCED, format: CourseFormat.ONLINE, hasCertificate: false, categorySlugs: ["matura-i-nauka"], coverUrl: IMG("1509228468518-180dd4864904") },
  { slug: "chemia-maturalna-pelny-kurs", title: "Chemia maturalna — pełny kurs", shortDescription: "Nieorganiczna, organiczna i obliczenia — poziom rozszerzony.", description: "Kompletny kurs chemii maturalnej. Chemia nieorganiczna, organiczna, obliczenia i strategia rozwiązywania arkuszy.", authorName: "Anna Lewandowska", platformName: "Matura.pl", priceModel: "499 PLN", language: "pl", level: CourseLevel.INTERMEDIATE, format: CourseFormat.ONLINE, hasCertificate: false, categorySlugs: ["matura-i-nauka"], coverUrl: IMG("1554475901-4538ddfbccc2") },
  { slug: "inwestowanie-w-etf", title: "Inwestowanie w ETF-y", shortDescription: "Portfel pasywny, koszty, IKE/IKZE i długoterminowa strategia.", description: "Kurs budowy pasywnego portfela ETF. Dywersyfikacja, koszty, konta emerytalne i psychologia długoterminowego inwestora.", authorName: "Marek Bogucki", platformName: "Strefa Inwestorów", priceModel: "699 PLN", language: "pl", level: CourseLevel.BEGINNER, format: CourseFormat.ONLINE, hasCertificate: false, categorySlugs: ["kryptowaluty-i-finanse"], coverUrl: IMG("1611974789855-9c2a0a7236a3") },
  { slug: "ethereum-smart-kontrakty", title: "Ethereum i smart kontrakty", shortDescription: "Solidity, EVM, testy i deploy zdecentralizowanych aplikacji.", description: "Kurs programowania na Ethereum. Solidity, wzorce bezpieczeństwa, testy, gas i wdrażanie kontraktów oraz dApps.", authorName: "Krzysztof Mazur", platformName: "BitcoinAcademy", priceModel: "1200 PLN", language: "pl", level: CourseLevel.ADVANCED, format: CourseFormat.ONLINE, hasCertificate: true, categorySlugs: ["kryptowaluty-i-finanse"], coverUrl: IMG("1518546305927-5a555bb7020d") },
];

export async function POST(request: Request) {
  const token = request.headers.get("x-reseed-token");
  const expected = process.env.RESEED_TOKEN;
  if (!expected || token !== expected) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const log: string[] = [];

  // Userzy (upsert)
  for (const u of USERS) {
    await db.user.upsert({
      where: { email: u.email },
      create: { email: u.email, name: u.name, role: u.role, emailVerified: new Date() },
      update: { name: u.name, role: u.role },
    });
  }

  // Kategorie (upsert)
  for (const c of CATEGORIES) {
    const parent = await db.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, name: c.name, description: c.description },
      update: { name: c.name, description: c.description },
    });
    for (const child of c.children ?? []) {
      await db.category.upsert({
        where: { slug: child.slug },
        create: { slug: child.slug, name: child.name, description: child.description, parentId: parent.id },
        update: { name: child.name, description: child.description, parentId: parent.id },
      });
    }
  }

  const usersByEmail = new Map(
    (await db.user.findMany({ where: { email: { in: USERS.map((u) => u.email) } } })).map((u) => [u.email, u]),
  );
  const categoriesBySlug = new Map((await db.category.findMany()).map((c) => [c.slug, c]));
  const criticId = usersByEmail.get(CRITIC_EMAIL)!.id;

  const before = await db.course.count();
  await db.course.deleteMany({});
  log.push(`deleted ${before} courses`);

  async function seedCourse(c: CourseSeed, i: number) {
    const course = await db.course.create({
      data: {
        slug: c.slug,
        title: c.title,
        coverUrl: c.coverUrl,
        shortDescription: c.shortDescription,
        description: c.description,
        authorName: c.authorName,
        platformName: c.platformName,
        priceModel: c.priceModel,
        language: c.language,
        level: c.level,
        format: c.format,
        hasCertificate: c.hasCertificate,
        status: CourseStatus.PUBLISHED,
      },
    });

    for (const slug of c.categorySlugs) {
      const cat = categoriesBySlug.get(slug);
      if (!cat) throw new Error(`Brak kategorii: ${slug}`);
      await db.courseCategory.create({ data: { courseId: course.id, categoryId: cat.id } });
    }

    const reviewers = [0, 1, 2].map((k) => USER_EMAILS[(i + k) % USER_EMAILS.length]);
    const extraRater = USER_EMAILS[(i + 3) % USER_EMAILS.length];
    const userRatingValues: number[] = [];

    for (let k = 0; k < reviewers.length; k++) {
      const user = usersByEmail.get(reviewers[k])!;
      const value = 7 + ((i + k) % 4);
      userRatingValues.push(value);
      await db.rating.create({ data: { courseId: course.id, userId: user.id, value, kind: ContentKind.USER } });
      await db.review.create({
        data: {
          courseId: course.id,
          userId: user.id,
          body: REVIEW_TEXTS[(i * 3 + k) % REVIEW_TEXTS.length],
          kind: ContentKind.USER,
        },
      });
    }
    {
      const user = usersByEmail.get(extraRater)!;
      const value = 7 + ((i + 1) % 4);
      userRatingValues.push(value);
      await db.rating.create({ data: { courseId: course.id, userId: user.id, value, kind: ContentKind.USER } });
    }
    const criticValue = 7 + (i % 4);
    await db.rating.create({ data: { courseId: course.id, userId: criticId, value: criticValue, kind: ContentKind.CRITIC } });

    const cached = computeRatings({ userValues: userRatingValues, criticValues: [criticValue] });
    await db.course.update({
      where: { id: course.id },
      data: { cachedRatings: cached, avgOverall: cached.overall, ratingsCount: userRatingValues.length + 1 },
    });
  }

  // Twórz kursy w małych partiach (ogranicz współbieżność do puli połączeń)
  const CHUNK = 4;
  for (let start = 0; start < COURSES.length; start += CHUNK) {
    const batch = COURSES.slice(start, start + CHUNK);
    await Promise.all(batch.map((c, j) => seedCourse(c, start + j)));
  }

  const after = await db.course.count();
  log.push(`created ${after} courses (each 3 reviews)`);

  return Response.json({ ok: true, before, after, log }, { headers: { "Cache-Control": "no-store" } });
}
