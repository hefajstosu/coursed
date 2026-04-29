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
  description: z.string().trim().max(2000).optional().or(z.literal("").transform(() => undefined)),
  parentId: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
