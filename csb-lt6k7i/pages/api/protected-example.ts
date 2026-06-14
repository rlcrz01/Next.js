/**
 * pages/api/protected-example.ts — Protected API route example.
 *
 * Demonstrates how to guard a Next.js API route with NextAuth session
 * validation on the server side.
 *
 * Protection layers:
 *  1. `getServerSession` verifies the JWT cookie server-side (no DB hit).
 *  2. A role check (`admin`) gates the sensitive action at the bottom.
 *
 * Access this endpoint at: GET /api/protected-example
 *
 * Responses:
 *  401 — No valid session (unauthenticated)
 *  403 — Authenticated but insufficient role
 *  405 — Wrong HTTP method
 *  200 — OK, returns sanitised session data
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------

interface SuccessResponse {
  message: string;
  user: {
    id: string;
    name: string | null | undefined;
    email: string | null | undefined;
    role: "user" | "admin";
  };
}

interface ErrorResponse {
  error: string;
}

type ApiResponse = SuccessResponse | ErrorResponse;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
): Promise<void> {
  // ── Method guard ──────────────────────────────────────────────────────────
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: `Method "${req.method}" not allowed.` });
    return;
  }

  // ── Authentication guard ──────────────────────────────────────────────────
  /**
   * `getServerSession` is the correct way to read the session in API routes.
   * Do NOT use `getSession` from "next-auth/react" on the server — it makes
   * an extra HTTP round-trip back to the /api/auth/session endpoint.
   */
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    res.status(401).json({
      error: "Unauthorized. You must be signed in to access this endpoint.",
    });
    return;
  }

  // ── Role guard (optional — remove if any authenticated user is allowed) ───
  /**
   * Replace "admin" with "user" if the route should be accessible to all
   * authenticated users, or remove this block entirely.
   *
   * For a hierarchy-aware check, see `requireRole` in lib/auth.ts.
   */
  if (session.user.role !== "admin") {
    res.status(403).json({
      error:
        "Forbidden. You do not have the required role to access this endpoint.",
    });
    return;
  }

  // ── Business logic ────────────────────────────────────────────────────────
  /**
   * At this point we know:
   *  • The request carries a valid, non-expired JWT session cookie.
   *  • `session.user.id` and `session.user.role` are set (see types/next-auth.d.ts).
   *  • The user holds the "admin" role.
   *
   * Add your actual data-fetching / mutation logic here.
   */
  res.status(200).json({
    message: "Access granted. Here is your protected data.",
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    },
  });
}
