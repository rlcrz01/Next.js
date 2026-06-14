/**
 * NextAuth.js catch-all API route — handles every request under /api/auth/*.
 *
 * Supported flows:
 *  • GitHub OAuth  (requires GITHUB_ID + GITHUB_SECRET env vars)
 *  • Google OAuth  (requires GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET env vars)
 *  • JWT sessions  (sessions are stored in a signed, encrypted HTTP-only cookie;
 *                   no database adapter is required in this configuration)
 *
 * Callbacks:
 *  • `jwt`     — runs when a JWT is created/updated; used to embed custom
 *                claims (id, role) into the token on first sign-in.
 *  • `session` — runs before the session is sent to the client; maps JWT
 *                claims onto the `Session` object (see types/next-auth.d.ts).
 *
 * Environment variables needed (add to .env.local):
 *  NEXTAUTH_URL          e.g. http://localhost:3000
 *  NEXTAUTH_SECRET       a random secret string (generate with `openssl rand -base64 32`)
 *  GITHUB_ID             GitHub OAuth App client ID
 *  GITHUB_SECRET         GitHub OAuth App client secret
 *  GOOGLE_CLIENT_ID      Google OAuth client ID
 *  GOOGLE_CLIENT_SECRET  Google OAuth client secret
 */

import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import type { Session, User } from "next-auth";

// ---------------------------------------------------------------------------
// Helper — read a required env var and throw early with a clear message
// ---------------------------------------------------------------------------
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: "${name}". ` +
        `Add it to your .env.local file (see .env.local.example).`
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// NextAuth configuration object — exported so it can be reused in
// server-side helpers (see lib/auth.ts → getServerSideSession).
// ---------------------------------------------------------------------------
export const authOptions: NextAuthOptions = {
  // ── Providers ────────────────────────────────────────────────────────────

  providers: [
    GithubProvider({
      clientId: requireEnv("GITHUB_ID"),
      clientSecret: requireEnv("GITHUB_SECRET"),
    }),
    GoogleProvider({
      clientId: requireEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
      authorization: {
        params: {
          // Always prompt the account-chooser so users can switch accounts.
          prompt: "select_account",
        },
      },
    }),
  ],

  // ── Session strategy ─────────────────────────────────────────────────────

  session: {
    /**
     * "jwt" stores the session entirely in a signed cookie — no DB needed.
     * Switch to "database" if you add a NextAuth adapter (e.g., Prisma).
     */
    strategy: "jwt",
    /** Session expires after 30 days of inactivity. */
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },

  // ── JWT options ───────────────────────────────────────────────────────────

  jwt: {
    /**
     * The secret used to sign & encrypt the JWT cookie.
     * NextAuth falls back to NEXTAUTH_SECRET automatically, but being
     * explicit makes auditing easier.
     */
    secret: process.env.NEXTAUTH_SECRET,
  },

  // ── Custom pages ─────────────────────────────────────────────────────────

  pages: {
    /** Replace the default NextAuth sign-in page with our custom UI. */
    signIn: "/auth/signin",
    /** Replace the default error page with our custom UI. */
    error: "/auth/error",
  },

  // ── Callbacks ─────────────────────────────────────────────────────────────

  callbacks: {
    /**
     * `jwt` callback — called whenever a JWT is created or updated.
     *
     * On the very *first* sign-in `user` is defined; on subsequent calls
     * (e.g., session refresh) only `token` is available.
     *
     * We persist `id` and `role` in the token so they survive across
     * requests without hitting a database.
     */
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: User;
    }): Promise<JWT> {
      if (user) {
        // First sign-in: seed the token with user data.
        token.id = user.id;
        // Default everyone to "user" role; promote to "admin" from your DB here.
        token.role = user.role ?? "user";
      }
      return token;
    },

    /**
     * `session` callback — called before the session object is sent to the
     * browser (via `useSession` or `getSession`).
     *
     * We lift the custom fields from the JWT into the session so client
     * components can read them without an extra API call.
     */
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<Session> {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },

  // ── Debug ─────────────────────────────────────────────────────────────────

  /**
   * Enable verbose NextAuth logging in development only.
   * Never enable in production — logs may contain sensitive token data.
   */
  debug: process.env.NODE_ENV === "development",
};

// ---------------------------------------------------------------------------
// Default export — hands control to NextAuth for all /api/auth/* routes.
// ---------------------------------------------------------------------------
export default NextAuth(authOptions);
