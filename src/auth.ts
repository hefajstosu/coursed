import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { clientIp } from "@/lib/client-ip";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import authConfig from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "database" },
  providers: [
    ...authConfig.providers,
    Resend({ from: process.env.EMAIL_FROM }),
  ],
  callbacks: {
    async signIn({ user, email }) {
      // Magic link: limit wysyłek per adres i per IP — chroni przed zasypywaniem
      // cudzej skrzynki i kosztami Resend. Callback odpala się przed utworzeniem
      // tokenu, więc obejmuje też bezpośredni POST na /api/auth/signin/resend.
      if (email?.verificationRequest && user.email) {
        const ip = await clientIp();
        const [byEmail, byIp] = await Promise.all([
          rateLimit(`magic-link:email:${user.email}`, LIMITS.magicLinkEmail),
          rateLimit(`magic-link:ip:${ip}`, LIMITS.magicLinkIp),
        ]);
        if (!byEmail.ok || !byIp.ok) return "/login?error=RateLimited";
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.banned = user.banned;
      }
      return session;
    },
  },
  events: {
    // #13 nadaj unikalny slug publicznego profilu przy tworzeniu konta
    async createUser({ user }) {
      if (!user.id) return;
      const base = slugify(user.name ?? "") || "user";
      let slug = base;
      let n = 1;
      while (await db.user.findUnique({ where: { slug }, select: { id: true } })) {
        n += 1;
        slug = `${base}-${n}`;
        if (n > 50) {
          slug = `u-${user.id.slice(0, 8)}`;
          break;
        }
      }
      await db.user.update({ where: { id: user.id }, data: { slug } });
    },
  },
});
