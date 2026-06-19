import { z } from "zod";
import { slugRegex } from "@/schemas/admin-courses";

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Min. 2 znaki").max(100),
  slug: z
    .string()
    .trim()
    .min(2, "Min. 2 znaki")
    .max(100)
    .regex(slugRegex, "Slug: małe litery, cyfry, myślniki"),
  // Puste pole z formularza przychodzi jako "" — normalizujemy do undefined.
  // Dla parentId pusty string łamie FK Category_parentId_fkey (P2003), bo "" nie
  // jest istniejącym ID. Poprzednie `.or(z.literal(""))` nie działało, bo
  // `.optional()` akceptuje "" i gałąź `.or` nigdy się nie uruchamiała.
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  parentId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
