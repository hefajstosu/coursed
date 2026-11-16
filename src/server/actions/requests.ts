"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/client-ip";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { courseRequestSchema } from "@/schemas/requests";

export type CourseRequestState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<"title" | "url" | "email" | "note", string>>;
};

async function clientKey() {
  return `course-request:${await clientIp()}`;
}

export async function submitCourseRequest(
  _prev: CourseRequestState,
  formData: FormData,
): Promise<CourseRequestState> {
  // Honeypot — boty często wypełniają każde pole. Niewidoczne dla ludzi.
  if ((formData.get("website") as string)?.trim()) {
    return { ok: true };
  }

  const parsed = courseRequestSchema.safeParse({
    title: formData.get("title"),
    url: formData.get("url"),
    email: formData.get("email"),
    note: formData.get("note"),
    isCreator: formData.get("isCreator") === "on",
  });

  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return {
      ok: false,
      error: "Popraw zaznaczone pola.",
      fieldErrors: {
        title: fe.title?.[0],
        url: fe.url?.[0],
        email: fe.email?.[0],
        note: fe.note?.[0],
      },
    };
  }

  const rl = await rateLimit(await clientKey(), LIMITS.courseRequest);
  if (!rl.ok) {
    return { ok: false, error: "Za dużo zgłoszeń z tego adresu. Spróbuj jutro." };
  }

  const session = await auth();
  if (session?.user?.banned) {
    return { ok: false, error: "Twoje konto zostało zawieszone." };
  }

  await db.courseRequest.create({
    data: {
      title: parsed.data.title,
      url: parsed.data.url ?? null,
      submitterEmail: parsed.data.email ?? session?.user?.email ?? null,
      note: parsed.data.note ?? null,
      isCreator: parsed.data.isCreator,
      createdById: session?.user?.id ?? null,
    },
  });

  return { ok: true };
}
