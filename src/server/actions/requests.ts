"use server";

import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { courseRequestSchema } from "@/schemas/requests";

export type CourseRequestState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<"title" | "url" | "email" | "note", string>>;
};

async function clientKey() {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || h.get("x-real-ip") || "anon";
  return `course-request:${ip}`;
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

  const rl = rateLimit(await clientKey(), LIMITS.courseRequest);
  if (!rl.ok) {
    return { ok: false, error: "Za dużo zgłoszeń z tego adresu. Spróbuj jutro." };
  }

  const session = await auth();

  await db.courseRequest.create({
    data: {
      title: parsed.data.title,
      url: parsed.data.url ?? null,
      submitterEmail: parsed.data.email ?? session?.user?.email ?? null,
      note: parsed.data.note ?? null,
      createdById: session?.user?.id ?? null,
    },
  });

  return { ok: true };
}
