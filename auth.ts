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
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      console.log("[AUTH JWT] Starting callback");
      console.log("[AUTH JWT] Has account:", !!account);
      console.log("[AUTH JWT] Token email:", token.email);

      // Store OAuth tokens on first sign-in
      if (account) {
        console.log("[AUTH JWT] ✅ Storing OAuth tokens from account");
        console.log("[AUTH JWT] Access token:", account.access_token?.substring(0, 20) + "...");
        console.log("[AUTH JWT] Refresh token:", account.refresh_token ? "present" : "MISSING");
        console.log("[AUTH JWT] Expires at:", account.expires_at);

        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }

      // Auto-create user on first sign-in
      if (profile && token.email) {
        console.log("[AUTH JWT] Creating/updating user for:", token.email);
        try {
          const supabase = createSupabaseServerClient();
          const { data: user, error } = await supabase
            .from("users")
            .upsert(
              {
                email: token.email,
                name: profile.name,
                image: (profile as any).picture,
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: "email",
                ignoreDuplicates: false,
              },
            )
            .select("id")
            .single();

          if (error) {
            console.error("[AUTH JWT] User upsert error:", error);
          } else {
            console.log("[AUTH JWT] ✅ User created/updated:", user?.id);
          }
        } catch (err) {
          console.error("[AUTH JWT] Exception creating user:", err);
        }
      }

      // Check if access token needs refresh
      if (token.expiresAt && token.refreshToken) {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = token.expiresAt as number;
        const timeUntilExpiry = expiresAt - now;

        console.log("[AUTH JWT] Token expiry check:", {
          now,
          expiresAt,
          timeUntilExpiry: `${timeUntilExpiry}s`,
          needsRefresh: timeUntilExpiry < 300,
        });

        // Refresh token 5 minutes before expiry
        if (timeUntilExpiry < 300) {
          console.log("[AUTH JWT] 🔄 Token expiring soon, refreshing...");
          try {
            const response = await fetch("https://oauth2.googleapis.com/token", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken as string,
              }),
            });

            const refreshedTokens = await response.json();

            if (!response.ok) {
              console.error("[AUTH JWT] ❌ Token refresh failed:", refreshedTokens);
              throw refreshedTokens;
            }

            console.log("[AUTH JWT] ✅ Token refreshed successfully");
            token.accessToken = refreshedTokens.access_token;
            token.expiresAt = Math.floor(Date.now() / 1000) + refreshedTokens.expires_in;

            if (refreshedTokens.refresh_token) {
              token.refreshToken = refreshedTokens.refresh_token;
            }
          } catch (error) {
            console.error("[AUTH JWT] ❌ Error refreshing token:", error);
            return { ...token, error: "RefreshAccessTokenError" };
          }
        } else {
          console.log("[AUTH JWT] ✅ Token still valid");
        }
      }

      return token;
    },

    async session({ session, token }) {
      console.log("[AUTH SESSION] Starting callback");
      console.log("[AUTH SESSION] Has accessToken:", !!token.accessToken);
      console.log("[AUTH SESSION] Has error:", !!token.error);

      // Pass OAuth tokens to session
      session.accessToken = token.accessToken as string;
      session.userEmail = token.email as string;

      // Pass refresh error to session
      if (token.error) {
        session.error = token.error as string;
      }

      console.log("[AUTH SESSION] ✅ Session configured");
      return session;
    },
  },
});
