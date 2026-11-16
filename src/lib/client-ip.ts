import "server-only";
import { headers } from "next/headers";

/** IP klienta z nagłówków proxy (Vercel ustawia `x-forwarded-for`). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || h.get("x-real-ip") || "anon";
}
