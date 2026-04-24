import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Adapter } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AppRole } from "@prisma/client";

import { db } from "@/lib/db";
import { isEmailVerificationRequired } from "@/lib/account-email";

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const authConfig = {
  adapter: PrismaAdapter(db) as Adapter,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.toLowerCase().trim();
        const password = parsed.data.password;

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        if (isEmailVerificationRequired() && !user.emailVerified) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const authUser = user as
        | {
            id?: string;
            role?: AppRole;
            name?: string | null;
            email?: string | null;
            image?: string | null;
          }
        | undefined;

      if (authUser?.id) {
        token.id = authUser.id;
      }

      if (authUser?.role) {
        token.role = authUser.role;
      }

      if (authUser?.name !== undefined) {
        token.name = authUser.name ?? undefined;
      }

      if (authUser?.email !== undefined) {
        token.email = authUser.email ?? undefined;
      }

      if (authUser?.image !== undefined) {
        token.picture = authUser.image ?? undefined;
      }

      if (token.sub && !token.role) {
        const dbUser = await db.user.findUnique({
          where: { id: token.sub },
          select: {
            role: true,
            name: true,
            email: true,
            image: true,
          },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.name = dbUser.name ?? undefined;
          token.email = dbUser.email ?? undefined;
          token.picture = dbUser.image ?? undefined;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub ?? "");
        session.user.role = (token.role as AppRole) ?? AppRole.PATIENT;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);