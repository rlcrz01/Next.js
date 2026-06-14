/**
 * middleware.ts — Edge Middleware for route-level authentication.
 *
 * Next.js 12 Edge Middleware runs before a request is completed, allowing
 * us to protect entire route segments without loading a full Node.js
 * runtime or hitting an API route.
 *
 * Strategy
 * ────────
 * We use NextAuth's lightweight `getToken` helper which decodes the
 * encrypted JWT cookie *without* a DB round-trip. If a valid token is
 * present the request passes through; otherwise the user is redirected to
 * the sign-in page with the original URL preserved as `callbackUrl`.
 *
 * Protected routes (edit `PROTECTED_PATHS` to match your application):
 *  /dashboard          — any authenticated user
 *  /dashboard/*        — any authenticated user
 *  /admin              — any authenticated user (role checked in the page)
 *  /admin/*            — any authenticated user (role checked in the page)
 *
 * Note: Fine-grained role enforcement (e.g., admin-only routes) is best
 * handled inside `getServerSideProps` using `requireRole` from lib/auth.ts,
 * because the Edge runtime cannot safely access a full database adapter.
 *
 * Docs: https://next-auth.js.org/configuration/nextjs#middleware
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Path prefixes that require an authenticated session.
 * The middleware `config.matcher` below controls which requests actually
 * invoke this function — keep the two lists in sync.
 */
const PROTECTED_PATHS: string[] = ["/dashboard", "/admin"];

// ---------------------------------------------------------------------------
// Middleware function
// ---------------------------------------------------------------------------

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // Determine whether the incoming path is protected.
  const isProtected = PROTECTED_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Non-protected routes pass straight through.
  if (!isProtected) {
    return NextResponse.next();
  }

  /**
   * `getToken` reads and verifies the NextAuth JWT cookie.
   *
   * `secret` must match NEXTAUTH_SECRET so the token can be decrypted.
   * In Edge Middleware we access env vars via `process.env` as usual.
   *
   * Returns `null` when:
   *  • no session cookie exists (user not logged in), OR
   *  • the cookie exists but the token is expired / tampered with.
   */
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    // Preserve the original destination so NextAuth redirects back after login.
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Token is valid — let the request continue to the page/API handler.
  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Route matcher
// ---------------------------------------------------------------------------

/**
 * Limits which requests trigger the middleware function above.
 * Static assets, _next internals, and the auth routes themselves are
 * intentionally excluded to avoid redirect loops and performance overhead.
 *
 * Keep this in sync with `PROTECTED_PATHS` above.
 */
export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *  - _next/static  (Next.js static assets)
     *  - _next/image   (Next.js image optimisation)
     *  - favicon.ico
     *  - /api/auth/*   (NextAuth's own API routes — would cause a loop)
     *  - /auth/*       (our custom sign-in / error pages)
     */
    "/dashboard",
    "/dashboard/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
