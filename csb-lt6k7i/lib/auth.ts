/**
 * lib/auth.ts — Server-side authentication utilities.
 *
 * This module centralises every server-side auth concern so that
 * individual page files stay focused on their own logic.
 *
 * Exports:
 *  • getServerSideSession   — thin wrapper around getServerSession; use in
 *                             getServerSideProps to read the current session.
 *  • requireSession         — same as above but redirects to /auth/signin
 *                             when the user is not authenticated; returns a
 *                             GetServerSideProps-compatible result object.
 *  • requireRole            — like requireSession but also enforces a minimum
 *                             role; redirects to / when the role is insufficient.
 *  • isAdmin                — predicate helper for role checks.
 *
 * All functions are server-only (Node.js). Do NOT import this file into
 * client components — use the `useAuthGuard` hook instead (hooks/useAuthGuard.ts).
 */

import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "../pages/api/auth/[...nextauth]";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The resolved user object from a guaranteed (non-null) session. */
export type AuthenticatedUser = Session["user"];

/**
 * Return value shape for `requireSession` / `requireRole`.
 * The page receives `session` as a prop; forward it to `SessionProvider`
 * via `pageProps.session` in _app.tsx to avoid a client-side fetch on load.
 */
export interface AuthenticatedProps {
  session: Session;
}

// ---------------------------------------------------------------------------
// getServerSideSession
// ---------------------------------------------------------------------------

/**
 * Read the current session inside `getServerSideProps`.
 *
 * Returns `null` when the user is not authenticated (no valid cookie/token).
 *
 * @example
 * ```ts
 * export const getServerSideProps: GetServerSideProps = async (ctx) => {
 *   const session = await getServerSideSession(ctx);
 *   return { props: { session } };
 * };
 * ```
 */
export async function getServerSideSession(
  ctx: GetServerSidePropsContext
): Promise<Session | null> {
  return getServerSession(ctx.req, ctx.res, authOptions);
}

// ---------------------------------------------------------------------------
// requireSession
// ---------------------------------------------------------------------------

/**
 * Enforce authentication in `getServerSideProps`.
 *
 * • If the user **is** authenticated   → returns `{ props: { session } }`.
 * • If the user **is not** authenticated → returns a redirect to `/auth/signin`
 *   with the current path as `callbackUrl`, so the user lands back here
 *   after a successful sign-in.
 *
 * @example
 * ```ts
 * export const getServerSideProps: GetServerSideProps = async (ctx) => {
 *   const result = await requireSession(ctx);
 *   if ("redirect" in result) return result; // unauthenticated → redirect
 *
 *   const { session } = result.props;
 *   // ... fetch data for the page
 *   return { props: { session, ...otherProps } };
 * };
 * ```
 */
export async function requireSession(
  ctx: GetServerSidePropsContext
): Promise<
  GetServerSidePropsResult<AuthenticatedProps> & { props?: AuthenticatedProps }
> {
  const session = await getServerSideSession(ctx);

  if (!session) {
    // Preserve the destination so NextAuth redirects back after sign-in.
    const callbackUrl = encodeURIComponent(ctx.resolvedUrl);
    return {
      redirect: {
        destination: `/auth/signin?callbackUrl=${callbackUrl}`,
        permanent: false,
      },
    };
  }

  return { props: { session } };
}

// ---------------------------------------------------------------------------
// requireRole
// ---------------------------------------------------------------------------

/**
 * Enforce authentication *and* a specific role in `getServerSideProps`.
 *
 * • Unauthenticated users are redirected to `/auth/signin`.
 * • Authenticated users with an insufficient role are redirected to `/`
 *   (change the `unauthorizedRedirect` option to suit your app).
 *
 * @param ctx - The `getServerSideProps` context object.
 * @param role - The required role (`"admin"` | `"user"`).
 * @param unauthorizedRedirect - Where to send authenticated-but-unauthorized
 *                               users. Defaults to `"/"`.
 *
 * @example
 * ```ts
 * export const getServerSideProps: GetServerSideProps = async (ctx) => {
 *   const result = await requireRole(ctx, "admin");
 *   if ("redirect" in result) return result;
 *
 *   return { props: { ...result.props } };
 * };
 * ```
 */
export async function requireRole(
  ctx: GetServerSidePropsContext,
  role: "user" | "admin",
  unauthorizedRedirect = "/"
): Promise<
  GetServerSidePropsResult<AuthenticatedProps> & { props?: AuthenticatedProps }
> {
  const sessionResult = await requireSession(ctx);

  // `requireSession` already handled the unauthenticated redirect case.
  if ("redirect" in sessionResult) return sessionResult;

  const { session } = (sessionResult as { props: AuthenticatedProps }).props;

  const roleHierarchy: Record<"user" | "admin", number> = {
    user: 1,
    admin: 2,
  };

  const hasRole = roleHierarchy[session.user.role] >= roleHierarchy[role];

  if (!hasRole) {
    return {
      redirect: {
        destination: unauthorizedRedirect,
        permanent: false,
      },
    };
  }

  return { props: { session } };
}

// ---------------------------------------------------------------------------
// isAdmin
// ---------------------------------------------------------------------------

/**
 * Simple predicate — returns `true` when the session user has the `"admin"` role.
 *
 * Works on both client (from `useSession`) and server (from `getServerSideSession`).
 *
 * @example
 * ```ts
 * const { data: session } = useSession();
 * if (isAdmin(session)) { ... }
 * ```
 */
export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === "admin";
}
