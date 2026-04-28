import { z } from "zod";

export const courseRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Tytuł musi mieć min. 3 znaki")
    .max(200, "Tytuł za długi (max 200 znaków)"),
  url: z
    .string()
    .trim()
    .url("Podaj poprawny URL")
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  email: z
    .string()
    .trim()
    .email("Podaj poprawny email")
    .max(200)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  note: z
    .string()
    .trim()
    .max(2000, "Notatka za długa (max 2000 znaków)")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  isCreator: z.boolean().default(false),
});

export type CourseRequestInput = z.infer<typeof courseRequestSchema>;
