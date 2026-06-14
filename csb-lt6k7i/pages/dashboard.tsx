/**
 * pages/dashboard.tsx — Protected page example.
 *
 * Demonstrates two complementary layers of auth protection:
 *
 *  1. **Server-side (SSR):** `requireSession` in `getServerSideProps` blocks
 *     unauthenticated requests *before* any HTML is sent. This gives the
 *     best UX (no flash of unauthenticated content) and is SEO-safe.
 *
 *  2. **Client-side:** The `useAuthGuard` hook re-validates on the client so
 *     that if a session expires mid-visit the user is redirected to sign-in
 *     without a full page reload.
 *
 * The middleware in `middleware.ts` provides a third, edge-level layer that
 * catches requests before they even reach this page handler.
 */

import type { GetServerSideProps, InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import { signOut } from "next-auth/react";
import { requireSession } from "../lib/auth";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { isAdmin } from "../lib/auth";
import styles from "../styles/Dashboard.module.css";

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

const DashboardPage: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ session: ssrSession }) => {
  /**
   * `useAuthGuard` keeps client-side auth in sync.
   * `session` here may be more up-to-date than the SSR snapshot if the
   * user's role changed mid-session (rare, but handled gracefully).
   */
  const { isLoading, session } = useAuthGuard();

  // Use the SSR session as fallback while the client-side hook hydrates.
  const activeSession = session ?? ssrSession;

  if (isLoading && !ssrSession) {
    return (
      <div className={styles.loadingContainer}>
        <p className={styles.loadingText}>Loading your dashboard…</p>
      </div>
    );
  }

  const user = activeSession?.user;
  const userIsAdmin = isAdmin(activeSession);

  return (
    <>
      <Head>
        <title>Dashboard</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className={styles.page}>
        {/* ── Navbar ──────────────────────────────────────────────── */}
        <header className={styles.navbar}>
          <span className={styles.brand}>MyApp</span>

          <div className={styles.navRight}>
            {user?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? "User avatar"}
                className={styles.avatar}
                width={36}
                height={36}
              />
            )}
            <span className={styles.userName}>{user?.name}</span>
            <button
              className={styles.signOutButton}
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out
            </button>
          </div>
        </header>

        {/* ── Main content ────────────────────────────────────────── */}
        <main className={styles.main}>
          {/* Welcome banner */}
          <section className={styles.welcomeCard}>
            <h1 className={styles.welcomeTitle}>
              Welcome back{user?.name ? `, ${user.name}` : ""}! 👋
            </h1>
            <p className={styles.welcomeSub}>
              You are signed in as{" "}
              <strong>{user?.email}</strong> with the{" "}
              <span className={styles.roleBadge} data-role={user?.role}>
                {user?.role ?? "user"}
              </span>{" "}
              role.
            </p>
          </section>

          {/* Session info card */}
          <section className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <h2 className={styles.infoCardTitle}>Session details</h2>
              <dl className={styles.definitionList}>
                <div className={styles.definitionRow}>
                  <dt>User ID</dt>
                  <dd>
                    <code>{user?.id ?? "—"}</code>
                  </dd>
                </div>
                <div className={styles.definitionRow}>
                  <dt>Name</dt>
                  <dd>{user?.name ?? "—"}</dd>
                </div>
                <div className={styles.definitionRow}>
                  <dt>Email</dt>
                  <dd>{user?.email ?? "—"}</dd>
                </div>
                <div className={styles.definitionRow}>
                  <dt>Role</dt>
                  <dd>
                    <span
                      className={styles.roleBadge}
                      data-role={user?.role}
                    >
                      {user?.role ?? "user"}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Admin-only card — rendered only when the user has the admin role */}
            {userIsAdmin && (
              <div className={`${styles.infoCard} ${styles.adminCard}`}>
                <h2 className={styles.infoCardTitle}>Admin panel</h2>
                <p className={styles.infoCardBody}>
                  You have elevated privileges. This section is only visible
                  to users with the <strong>admin</strong> role.
                </p>
                <a href="/admin" className={styles.adminLink}>
                  Go to Admin →
                </a>
              </div>
            )}
          </section>

          {/* Raw session JSON — useful during development */}
          {process.env.NODE_ENV === "development" && (
            <section className={styles.devPanel}>
              <h2 className={styles.devPanelTitle}>
                🛠 Session payload (dev only)
              </h2>
              <pre className={styles.jsonPre}>
                {JSON.stringify(activeSession, null, 2)}
              </pre>
            </section>
          )}
        </main>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Data fetching — server-side auth guard
// ---------------------------------------------------------------------------

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  /**
   * `requireSession` returns either:
   *  • `{ props: { session } }` — user is authenticated
   *  • `{ redirect: { destination, permanent } }` — user is not authenticated
   *
   * If we get a redirect result we return it immediately; Next.js handles
   * the actual HTTP redirect before any JSX is rendered.
   */
  const result = await requireSession(ctx);

  // Unauthenticated → redirect to sign-in (result contains `redirect` key).
  if ("redirect" in result) return result;

  // Authenticated → pass the session as a prop.
  return result;
};

export default DashboardPage;
