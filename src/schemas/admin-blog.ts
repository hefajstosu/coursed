import { z } from "zod";
import { slugRegex } from "@/schemas/admin-courses";

export const blogPostFormSchema = z.object({
  title: z.string().trim().min(3, "Min. 3 znaki").max(200),
  slug: z
    .string()
    .trim()
    .min(3, "Min. 3 znaki")
    .max(200)
    .regex(slugRegex, "Slug: małe litery, cyfry, myślniki"),
  excerpt: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
  content: z.string().trim().min(20, "Treść min. 20 znaków").max(50000),
  coverUrl: z
    .string()
    .trim()
    .url("Podaj poprawny URL")
    .max(1000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

export type BlogPostFormInput = z.infer<typeof blogPostFormSchema>;
