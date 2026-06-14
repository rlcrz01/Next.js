/**
 * hooks/useAuthGuard.ts — Client-side authentication guard hook.
 *
 * Wraps NextAuth's `useSession` to provide a consistent, type-safe
 * pattern for protecting client-rendered pages and components.
 *
 * Features:
 *  • Redirects unauthenticated users to the sign-in page automatically.
 *  • Optionally enforces a minimum role (e.g., "admin").
 *  • Redirects role-insufficient users to a configurable fallback route.
 *  • Exposes granular loading / authenticated / authorized state flags so
 *    components can render appropriate skeleton / error UIs.
 *
 * Usage (basic — authentication only):
 * ```tsx
 * export default function ProtectedPage() {
 *   const { isLoading, isAuthenticated, session } = useAuthGuard();
 *
 *   if (isLoading) return <p>Loading…</p>;
 *   // If we reach here the user is authenticated; redirect already fired for guests.
 *   return <p>Hello {session?.user?.name}</p>;
 * }
 * ```
 *
 * Usage (role enforcement):
 * ```tsx
 * export default function AdminPage() {
 *   const { isLoading, isAuthorized } = useAuthGuard({
 *     requiredRole: "admin",
 *     unauthorizedRedirect: "/dashboard",
 *   });
 *
 *   if (isLoading || !isAuthorized) return null;
 *   return <AdminPanel />;
 * }
 * ```
 */

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import type { Session } from "next-auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseAuthGuardOptions {
  /**
   * Where to send unauthenticated users.
   * Defaults to `/auth/signin` with the current path as `callbackUrl`.
   */
  signInRedirect?: string;

  /**
   * Minimum role required to access the guarded page/component.
   * When omitted, only authentication is checked (any role is accepted).
   */
  requiredRole?: "user" | "admin";

  /**
   * Where to send authenticated users who lack the required role.
   * Defaults to `"/"`.
   */
  unauthorizedRedirect?: string;
}

export interface UseAuthGuardResult {
  /** `true` while the session status is still being determined. */
  isLoading: boolean;

  /**
   * `true` once the session has loaded AND the user is signed in.
   * Stays `false` for unauthenticated users (redirect is already pending).
   */
  isAuthenticated: boolean;

  /**
   * `true` when the user is authenticated AND satisfies the `requiredRole`.
   * Equivalent to `isAuthenticated` when no `requiredRole` is provided.
   */
  isAuthorized: boolean;

  /**
   * The raw NextAuth session object (typed with our custom extensions).
   * `null` when unauthenticated or while loading.
   */
  session: Session | null;

  /**
   * The raw NextAuth session status string (`"loading"`, `"authenticated"`,
   * `"unauthenticated"`). Useful for fine-grained UI states.
   */
  status: "loading" | "authenticated" | "unauthenticated";
}

// ---------------------------------------------------------------------------
// Role helpers
// ---------------------------------------------------------------------------

const ROLE_HIERARCHY: Record<"user" | "admin", number> = {
  user: 1,
  admin: 2,
};

function meetsRole(
  userRole: "user" | "admin" | undefined,
  requiredRole: "user" | "admin"
): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Client-side auth guard.
 *
 * Must be used inside a component tree wrapped by `SessionProvider`
 * (configured in `pages/_app.tsx`).
 */
export function useAuthGuard(
  options: UseAuthGuardOptions = {}
): UseAuthGuardResult {
  const {
    signInRedirect,
    requiredRole,
    unauthorizedRedirect = "/",
  } = options;

  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && session !== null;

  const isAuthorized =
    isAuthenticated &&
    (requiredRole === undefined ||
      meetsRole(session?.user?.role, requiredRole));

  useEffect(() => {
    // Wait until NextAuth has resolved the session before acting.
    if (isLoading) return;

    if (!isAuthenticated) {
      // Build the callback URL so NextAuth can redirect back after sign-in.
      const callbackUrl = encodeURIComponent(router.asPath);
      const destination =
        signInRedirect ?? `/auth/signin?callbackUrl=${callbackUrl}`;
      router.replace(destination);
      return;
    }

    if (isAuthenticated && !isAuthorized) {
      // Authenticated but insufficient role.
      router.replace(unauthorizedRedirect);
    }
  }, [
    isLoading,
    isAuthenticated,
    isAuthorized,
    router,
    signInRedirect,
    unauthorizedRedirect,
  ]);

  return {
    isLoading,
    isAuthenticated,
    isAuthorized,
    session: session ?? null,
    status,
  };
}
