import NextAuth from "next-auth";
import Auth0 from "next-auth/providers/auth0";
import type { Auth0Profile } from "next-auth/providers/auth0";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Auth0({
      clientId: process.env.AUTH_AUTH0_ID!,
      clientSecret: process.env.AUTH_AUTH0_SECRET!,
      issuer: process.env.AUTH_AUTH0_ISSUER!,
      profile(profile: Auth0Profile) {
        return {
          ...profile,
          id: profile.sub,
          name: profile.name ?? profile.nickname ?? null,
          email: profile.email ?? null,
          image: profile.picture ?? null,
          username: profile.nickname ?? null,
          phone:
            ((profile as Record<string, unknown>).phone_number as string) ??
            null,
        };
      },
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    /**
     * `user` is present on sign-in only.
     * `user.id` = profile.sub = Auth0 sub claim (stable across sign-ins).
     * We find-or-create our app User record and store the friendly `userId`
     * in the token so plans/stops can use it as a consistent foreign key.
     */
    async jwt({ token, user }) {
      if (user) {
        // token.sub is set by NextAuth directly from the Auth0 ID token's `sub` claim.
        // It is stable across every sign-in for the same Auth0 account.
        // user.id is NOT reliable without a DB adapter (NextAuth may generate a fresh one).
        const auth0Sub = user.sub!;
        console.log("[Auth jwt] sign-in, auth0Sub:", auth0Sub);

        try {
          await connectDB();

          let dbUser = (await User.findOne({ auth0Sub }).lean()) as null | {
            _id: unknown;
            userId: string;
            phone?: string;
          };

          if (!dbUser) {
            const u = user as typeof user & {
              username?: string;
              phone?: string;
            };
            const created = await User.create({
              auth0Sub,
              username: u.username ?? user.name ?? "",
              email: user.email ?? "",
              name: user.name ?? "",
              image: user.image ?? "",
              phone: u.phone ?? "",
            });
            dbUser = created.toObject() as typeof dbUser;
            console.log("[Auth jwt] created user, userId:", dbUser!.userId);
          } else {
            console.log("[Auth jwt] found user, userId:", dbUser.userId);
          }

          token.userId = dbUser!.userId;
          token.phone = dbUser!.phone ?? null;
        } catch (err) {
          console.error("[Auth jwt] DB error:", err);
          // Fallback: use auth0Sub so the user is at least not blocked
          token.userId = auth0Sub;
        }
      }

      console.log("[Auth jwt] returning token.userId:", token.userId);
      return token;
    },

    session({ session, token }) {
      session.user.id = (token.userId ?? token.sub ?? "") as string;
      session.user.phone = (token.phone as string | null) ?? null;
      return session;
    },
  },
});
