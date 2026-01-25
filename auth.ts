import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }

      // Store user in database and get userId
      if (profile && profile.email) {
        const supabase = createSupabaseServerClient();

        const { data: user, error } = await supabase
          .from("users")
          .upsert(
            {
              email: profile.email,
              name: profile.name as string,
              image: (profile as any).picture,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "email",
              ignoreDuplicates: false,
            }
          )
          .select("id")
          .single();

        if (user && !error) {
          token.userId = user.id;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.userId = token.userId as string;
      return session;
    },
  },
});
