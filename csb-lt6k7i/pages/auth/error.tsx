/**
 * pages/auth/error.tsx — Custom NextAuth error page.
 *
 * Registered via the `pages.error` NextAuth option.
 * NextAuth redirects here when a fatal auth error occurs (e.g., a provider
 * misconfiguration or access-denied response from an OAuth provider).
 *
 * The `error` query param contains one of the codes listed at:
 * https://next-auth.js.org/configuration/pages#error-page
 */

import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import styles from "../../styles/Auth.module.css";

// ---------------------------------------------------------------------------
// Error catalogue
// ---------------------------------------------------------------------------

interface ErrorInfo {
  heading: string;
  description: string;
}

const ERROR_CATALOGUE: Record<string, ErrorInfo> = {
  Configuration: {
    heading: "Server configuration error",
    description:
      "There is a problem with the server's authentication configuration. " +
      "Please contact the site administrator.",
  },
  AccessDenied: {
    heading: "Access denied",
    description:
      "You do not have permission to sign in with this account. " +
      "If you believe this is a mistake, please contact support.",
  },
  Verification: {
    heading: "Link expired",
    description:
      "The sign-in link has expired or has already been used. " +
      "Please request a new one.",
  },
  Default: {
    heading: "Authentication error",
    description:
      "An unexpected error occurred during authentication. " +
      "Please try again or contact support if the problem persists.",
  },
};

function getErrorInfo(code: string | null): ErrorInfo {
  if (!code) return ERROR_CATALOGUE.Default;
  return ERROR_CATALOGUE[code] ?? ERROR_CATALOGUE.Default;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

interface AuthErrorPageProps {
  errorCode: string | null;
}

const AuthErrorPage: NextPage<AuthErrorPageProps> = ({ errorCode }) => {
  const { heading, description } = getErrorInfo(errorCode);

  return (
    <>
      <Head>
        <title>Authentication Error</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className={styles.container}>
        <div className={styles.card}>
          {/* ── Error icon ────────────────────────────────────────── */}
          <div className={styles.errorIconLarge} aria-hidden="true">
            🔒
          </div>

          {/* ── Message ───────────────────────────────────────────── */}
          <div className={styles.header}>
            <h1 className={styles.title}>{heading}</h1>
            <p className={styles.subtitle}>{description}</p>
          </div>

          {/* ── Debug info (dev only) ─────────────────────────────── */}
          {process.env.NODE_ENV === "development" && errorCode && (
            <p className={styles.debugCode}>
              Error code: <code>{errorCode}</code>
            </p>
          )}

          {/* ── Actions ───────────────────────────────────────────── */}
          <div className={styles.actionRow}>
            <Link href="/auth/signin">
              <a className={styles.primaryButton}>Try again</a>
            </Link>
            <Link href="/">
              <a className={styles.ghostButton}>Go home</a>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

export const getServerSideProps: GetServerSideProps<
  AuthErrorPageProps
> = async (ctx) => {
  const errorCode =
    typeof ctx.query.error === "string" ? ctx.query.error : null;

  return { props: { errorCode } };
};

export default AuthErrorPage;
