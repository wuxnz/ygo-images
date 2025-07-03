import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/server/db";
import Discord from "next-auth/providers/discord";
import Twitch from "next-auth/providers/twitch";
import Google from "next-auth/providers/google";

export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(db),
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (!user?.id) return token;
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

      if (isOnDashboard) {
        return isLoggedIn;
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/dashboard/tournaments", nextUrl));
      }
      return true;
    },
  },
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
    }),
    Twitch({
      clientId: process.env.AUTH_TWITCH_ID,
      clientSecret: process.env.AUTH_TWITCH_SECRET,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;
