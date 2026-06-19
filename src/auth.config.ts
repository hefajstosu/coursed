import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export default {
  providers: [
    // Google weryfikuje własność e-maila, więc bezpiecznie łączymy logowanie
    // Google z istniejącym kontem o tym samym mailu (np. założonym magic-linkiem).
    // Bez tego Auth.js zwraca OAuthAccountNotLinked i logowanie „przechodzi", ale
    // nie zalogowuje.
    Google({ allowDangerousEmailAccountLinking: true }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/sprawdz-email",
  },
} satisfies NextAuthConfig;
