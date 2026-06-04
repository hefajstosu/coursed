import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    role: UserRole;
    banned: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      banned: boolean;
    } & DefaultSession["user"];
  }
}
