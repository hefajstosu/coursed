import { z } from "zod";

const optionalString = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

const optionalUrl = z
  .string()
  .trim()
  .url("Podaj poprawny URL")
  .max(1000)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const courseFormSchema = z.object({
  title: z.string().trim().min(3, "Min. 3 znaki").max(200),
  slug: z
    .string()
    .trim()
    .min(3, "Min. 3 znaki")
    .max(200)
    .regex(slugRegex, "Slug: małe litery, cyfry, myślniki"),
  shortDescription: optionalString(300),
  description: z.string().trim().max(20000).optional().or(z.literal("").transform(() => undefined)),
  coverUrl: optionalUrl,
  authorName: optionalString(200),
  platformName: optionalString(200),
  officialUrl: optionalUrl,
  priceModel: optionalString(100),
  language: optionalString(10),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional().or(z.literal("").transform(() => undefined)),
  format: z.enum(["ONLINE", "OFFLINE", "HYBRID"]),
  hasCertificate: z.boolean().default(false),
  location: optionalString(200),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  categoryIds: z.array(z.string()).default([]),
});

export type CourseFormInput = z.infer<typeof courseFormSchema>;
