/**
 * NextAuth.js TypeScript module augmentation.
 *
 * Extends the built-in NextAuth session/JWT types so that every call to
 * `useSession()`, `getSession()`, or `getServerSideProps` receives our
 * custom fields with full type-safety — no `any` casts needed anywhere.
 *
 * Docs: https://next-auth.js.org/getting-started/typescript#module-augmentation
 */

import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

// ---------------------------------------------------------------------------
// Extend the built-in session types
// ---------------------------------------------------------------------------

declare module "next-auth" {
  /**
   * The shape of the object returned by `useSession()`, `getSession()`, and
   * received as a prop in the `SessionProvider`.
   */
  interface Session {
    /** Augmented user object carried inside the session. */
    user: {
      /** Database / provider user ID (mapped from the JWT `sub` claim). */
      id: string;
      /**
       * Application-level role. Defaults to `"user"` unless overridden in
       * the `session` callback (e.g., for admins fetched from your DB).
       */
      role: "user" | "admin";
    } & DefaultSession["user"]; // keeps name, email, image from the default
  }

  /**
   * The shape of the user object returned by an OAuth provider or the
   * `authorize` callback of a Credentials provider.  Adding fields here
   * makes them available inside the `jwt` callback's `user` parameter on
   * the *first* sign-in.
   */
  interface User extends DefaultUser {
    role?: "user" | "admin";
  }
}

// ---------------------------------------------------------------------------
// Extend the built-in JWT type
// ---------------------------------------------------------------------------

declare module "next-auth/jwt" {
  /**
   * The shape of the JWT payload stored in the encrypted cookie / token.
   * Fields added here are accessible in both the `jwt` and `session`
   * NextAuth callbacks.
   */
  interface JWT extends DefaultJWT {
    /** Copied from `user.id` on first sign-in, then persisted in the token. */
    id: string;
    /** Copied from `user.role` on first sign-in, then persisted in the token. */
    role: "user" | "admin";
  }
}
