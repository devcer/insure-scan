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
      console.log("[AUTH JWT] Starting callback");
      console.log("[AUTH JWT] token.email:", token.email);
      console.log("[AUTH JWT] token.userId:", token.userId);
      console.log("[AUTH JWT] Has account:", !!account);
      console.log("[AUTH JWT] Has profile:", !!profile);

      if (account) {
        console.log("[AUTH JWT] Setting access token from account");
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at; // Token expiry timestamp
      }

      // Check if access token is expired and refresh it
      if (token.expiresAt && token.refreshToken) {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = token.expiresAt as number;

        // Refresh token 5 minutes before it expires
        if (now >= expiresAt - 300) {
          console.log("[AUTH JWT] Token expired, refreshing...");
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
              console.error("[AUTH JWT] Token refresh failed:", refreshedTokens);
              throw refreshedTokens;
            }

            console.log("[AUTH JWT] ✅ Token refreshed successfully");
            token.accessToken = refreshedTokens.access_token;
            token.expiresAt = Math.floor(Date.now() / 1000) + refreshedTokens.expires_in;

            // Update refresh token if provided
            if (refreshedTokens.refresh_token) {
              token.refreshToken = refreshedTokens.refresh_token;
            }
          } catch (error) {
            console.error("[AUTH JWT] ❌ Error refreshing token:", error);
            // Return token with error so user can re-authenticate
            return { ...token, error: "RefreshAccessTokenError" };
          }
        }
      }

      // Ensure userId is always set
      if (!token.userId && token.email) {
        console.log("[AUTH JWT] userId missing, attempting lookup for:", token.email);
        try {
          const supabase = createSupabaseServerClient();
          console.log("[AUTH JWT] Supabase client created");

          // Look up existing user by email
          const { data: existing, error: lookupError } = await supabase.from("users").select("id").eq("email", token.email).single();

          console.log("[AUTH JWT] Lookup result:", { existing, lookupError });

          if (lookupError) {
            console.error("[AUTH JWT] Lookup error:", lookupError);
          }

          if (existing && existing.id) {
            token.userId = existing.id;
            console.log("[AUTH JWT] ✅ Set token.userId from lookup:", token.userId);
          } else {
            console.warn("[AUTH JWT] ⚠️ No existing user found for:", token.email);
          }
        } catch (err) {
          console.error("[AUTH JWT] Exception during lookup:", err);
        }
      }

      // Store user in database and get userId (only during sign-in when profile exists)
      if (profile && profile.email) {
        console.log("[AUTH JWT] Profile exists, upserting user:", profile.email);
        try {
          const supabase = createSupabaseServerClient();
          let userId: string | undefined = undefined;

          // Try upsert and get id
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
              },
            )
            .select("id")
            .single();

          console.log("[AUTH JWT] Upsert result:", { user, error });

          if (error) {
            console.error("[AUTH JWT] Upsert error:", error);
          }

          if (user && user.id) {
            userId = user.id;
            console.log("[AUTH JWT] Got userId from upsert:", userId);
          } else {
            console.warn("[AUTH JWT] Upsert didn't return user, trying fallback fetch");
            // Fallback: fetch by email
            const { data: existing, error: fetchError } = await supabase.from("users").select("id").eq("email", profile.email).single();

            console.log("[AUTH JWT] Fallback fetch result:", { existing, fetchError });

            if (fetchError) {
              console.error("[AUTH JWT] Fallback fetch error:", fetchError);
            }

            if (existing && existing.id) {
              userId = existing.id;
              console.log("[AUTH JWT] Got userId from fallback:", userId);
            }
          }

          if (userId) {
            token.userId = userId;
            console.log("[AUTH JWT] ✅ Set token.userId from profile:", userId);
          } else {
            console.error("[AUTH JWT] ❌ Failed to get userId from profile");
          }
        } catch (err) {
          console.error("[AUTH JWT] Exception during upsert:", err);
        }
      }

      console.log("[AUTH JWT] Final token.userId:", token.userId);
      console.log("[AUTH JWT] Final token.email:", token.email);
      return token;
    },
    async session({ session, token }) {
      console.log("[AUTH SESSION] Starting callback");
      console.log("[AUTH SESSION] token.userId:", token.userId);
      console.log("[AUTH SESSION] token.accessToken:", !!token.accessToken);
      console.log("[AUTH SESSION] token.error:", token.error);

      // Pass error to session so client can handle re-authentication
      if (token.error) {
        session.error = token.error as string;
      }

      session.accessToken = token.accessToken as string;
      if (token.userId) {
        session.userId = token.userId as string;
        console.log("[AUTH SESSION] ✅ Set session.userId:", session.userId);
      } else {
        console.error("[AUTH SESSION] ❌ token.userId is missing!");
      }

      return session;
    },
  },
});
