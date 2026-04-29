import { z } from "zod";

export const rateCourseSchema = z.object({
  courseId: z.string().min(1),
  value: z.number().int().min(1).max(10),
});

export const addReviewSchema = z.object({
  courseId: z.string().min(1),
  body: z.string().min(20, "Opinia musi mieć min. 20 znaków").max(5000),
  value: z.number().int().min(1).max(10),
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
