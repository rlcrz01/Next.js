/**
 * pages/index.tsx — Home page (public, no auth required).
 *
 * Updated from the template to showcase the authentication integration:
 *  • Shows a "Sign in" CTA for guests.
 *  • Shows "Go to Dashboard" + "Sign out" for authenticated users.
 *  • Reads the session client-side via `useSession` (no SSR needed here
 *    since the page is public — no redirect, just conditional rendering).
 */

import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import styles from "../styles/Home.module.css";

const HomePage: NextPage = () => {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  return (
    <div className={styles.container}>
      <Head>
        <title>Next.js + NextAuth.js</title>
        <meta
          name="description"
          content="Next.js starter template with NextAuth.js authentication"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Next.js +{" "}
          <a
            href="https://next-auth.js.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            NextAuth.js
          </a>
        </h1>

        <p className={styles.description}>
          A production-ready authentication integration with GitHub &amp; Google
          OAuth, JWT sessions, and protected routes.
        </p>

        {/* ── Auth controls ───────────────────────────────────────── */}
        <div className={styles.authSection}>
          {isLoading && (
            <p className={styles.authLoading}>Loading session…</p>
          )}

          {!isLoading && !session && (
            <>
              <p className={styles.authPrompt}>
                Sign in to access your dashboard.
              </p>
              <button
                className={styles.authButton}
                onClick={() => signIn(undefined, { callbackUrl: "/dashboard" })}
              >
                Sign in
              </button>
            </>
          )}

          {!isLoading && session && (
            <>
              <p className={styles.authPrompt}>
                Signed in as <strong>{session.user?.email}</strong>
              </p>
              <div className={styles.authButtonRow}>
                <Link href="/dashboard">
                  <a className={styles.authButton}>Go to Dashboard →</a>
                </Link>
                <button
                  className={styles.authButtonOutline}
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Feature grid ────────────────────────────────────────── */}
        <div className={styles.grid}>
          <a
            href="https://next-auth.js.org/getting-started/introduction"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
          >
            <h2>NextAuth.js Docs &rarr;</h2>
            <p>Learn about providers, adapters, callbacks, and more.</p>
          </a>

          <a
            href="https://next-auth.js.org/configuration/providers/oauth"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
          >
            <h2>OAuth Providers &rarr;</h2>
            <p>Plug in 50+ built-in OAuth provider configurations.</p>
          </a>

          <a
            href="https://next-auth.js.org/configuration/callbacks"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
          >
            <h2>Callbacks &rarr;</h2>
            <p>
              Customise session content, JWT claims, and redirect behaviour.
            </p>
          </a>

          <a
            href="https://nextjs.org/docs/middleware"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
          >
            <h2>Middleware &rarr;</h2>
            <p>
              Protect routes at the edge before they reach your page handlers.
            </p>
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        Powered by{" "}
        <a
          href="https://nextjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Next.js
        </a>{" "}
        &amp;{" "}
        <a
          href="https://next-auth.js.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          NextAuth.js
        </a>
      </footer>
    </div>
  );
};

export default HomePage;
