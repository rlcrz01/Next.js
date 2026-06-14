/**
 * next.config.js — Next.js configuration.
 *
 * NextAuth.js relies on the following environment variables at runtime.
 * They are read by Next.js from .env.local (never committed to source control).
 *
 * Required:
 *   NEXTAUTH_URL      — The canonical base URL of your deployment
 *                       (e.g. http://localhost:3000 in development).
 *                       Next.js 12 does NOT set this automatically; you must
 *                       define it explicitly.
 *   NEXTAUTH_SECRET   — A random secret used to sign/encrypt JWT cookies.
 *                       Generate one with: openssl rand -base64 32
 *
 * OAuth providers (add whichever you configure in [...nextauth].ts):
 *   GITHUB_ID             — GitHub OAuth App Client ID
 *   GITHUB_SECRET         — GitHub OAuth App Client Secret
 *   GOOGLE_CLIENT_ID      — Google OAuth Client ID
 *   GOOGLE_CLIENT_SECRET  — Google OAuth Client Secret
 *
 * See .env.local.example for a ready-to-copy template.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
