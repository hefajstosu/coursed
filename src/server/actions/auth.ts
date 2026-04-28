"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/auth";

const SESSION_COOKIE = "authjs.session-token";
const SESSION_TTL_DAYS = 30;

/**
 * Dev-only: tworzy sesję bezpośrednio w DB i ustawia cookie.
 * Pozwala testować flow bez stawiania Google OAuth / Resend.
 */
export async function devSignInAs(formData: FormData) {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Dev login is disabled outside development.");
  }

  const email = z.string().email().parse(formData.get("email"));

  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error(`User not found: ${email}`);

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: { sessionToken: token, userId: user.id, expires },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    expires,
    path: "/",
    secure: process.env.AUTH_URL?.startsWith("https://") ?? false,
  });

  redirect("/");
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/" });
}

export async function signInWithMagicLink(formData: FormData) {
  const email = z.string().email().parse(formData.get("email"));
  await signIn("resend", { email, redirectTo: "/login/sprawdz-email" });
}

export async function logOut() {
  await signOut({ redirectTo: "/" });
}
