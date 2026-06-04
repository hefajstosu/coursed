import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
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
