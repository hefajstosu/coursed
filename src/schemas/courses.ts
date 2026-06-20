import { z } from "zod";

export const rateCourseSchema = z.object({
  courseId: z.string().min(1),
  value: z.number().int().min(1).max(10),
});

const aspectScore = z.number().int().min(1).max(10).nullish();

export const addReviewSchema = z.object({
  courseId: z.string().min(1),
  // Tekst opinii opcjonalny — można wystawić samą ocenę, bez minimalnej liczby
  // znaków. Puste/whitespace = brak opinii (obsługa w addReview).
  body: z.string().max(5000).optional().default(""),
  value: z.number().int().min(1).max(10),
  // #9 oceny szczegółowe — opcjonalne
  valueContent: aspectScore,
  valueInstructor: aspectScore,
  valueWorth: aspectScore,
});

export const voteReviewSchema = z.object({
  reviewId: z.string().min(1),
  value: z.union([z.literal(1), z.literal(-1)]),
});

export const reportReviewSchema = z.object({
  reviewId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export type RateCourseInput = z.infer<typeof rateCourseSchema>;
export type AddReviewInput = z.infer<typeof addReviewSchema>;
