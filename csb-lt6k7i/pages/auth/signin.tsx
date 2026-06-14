/**
 * pages/auth/signin.tsx — Custom sign-in page.
 *
 * Registered in the NextAuth `pages.signIn` option so NextAuth redirects
 * here instead of its built-in UI.
 *
 * Features:
 *  • Lists every configured provider dynamically via `getServerSideProps`
 *    so the page stays in sync if you add or remove providers.
 *  • Reads `callbackUrl` from the query string and forwards it to NextAuth
 *    so users land back where they started after authentication.
 *  • Reads `error` from the query string and displays a human-readable
 *    message when NextAuth redirects back with an auth error.
 *  • Redirects already-authenticated users away from this page.
 *
 * Docs: https://next-auth.js.org/configuration/pages#sign-in-page
 */

import type {
  GetServerSideProps,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import Head from "next/head";
import { getProviders, signIn } from "next-auth/react";
import { getServerSideSession } from "../../lib/auth";
import styles from "../../styles/Auth.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Providers = Awaited<ReturnType<typeof getProviders>>;

interface SignInPageProps {
  providers: Providers;
  callbackUrl: string;
  errorType: string | null;
}

// ---------------------------------------------------------------------------
// Error message map
// ---------------------------------------------------------------------------

/**
 * NextAuth passes short error codes via the `error` query param.
 * Map them to friendly messages for our custom UI.
 * Full list: https://next-auth.js.org/configuration/pages#sign-in-page (Error codes section)
 */
const AUTH_ERRORS: Record<string, string> = {
  Signin: "Try signing in with a different account.",
  OAuthSignin: "Could not start the OAuth sign-in flow. Please try again.",
  OAuthCallback: "Could not complete the OAuth sign-in. Please try again.",
  OAuthCreateAccount:
    "Could not create an account with this provider. Try a different one.",
  EmailCreateAccount: "Could not create an account with this email.",
  Callback: "An error occurred during sign-in. Please try again.",
  OAuthAccountNotLinked:
    "This email is already linked to another provider. Sign in with that provider.",
  EmailSignin: "The sign-in email could not be sent.",
  CredentialsSignin:
    "Sign-in failed. Check that your credentials are correct.",
  SessionRequired: "Please sign in to access this page.",
  Default: "An unexpected error occurred. Please try again.",
};

function getFriendlyError(errorCode: string | null): string | null {
  if (!errorCode) return null;
  return AUTH_ERRORS[errorCode] ?? AUTH_ERRORS.Default;
}

// ---------------------------------------------------------------------------
// Provider icon helper
// ---------------------------------------------------------------------------

/** Maps known provider IDs to SVG icon markup. Extend as you add providers. */
function ProviderIcon({ providerId }: { providerId: string }): JSX.Element {
  if (providerId === "github") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={styles.providerIcon}
        fill="currentColor"
      >
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.52 11.52 0 0 1 12 6.803a11.56 11.56 0 0 1 3.005.404c2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
      </svg>
    );
  }
  if (providerId === "google") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className={styles.providerIcon}
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    );
  }
  // Generic fallback icon
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={styles.providerIcon}
      fill="currentColor"
    >
      <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-11h2v6h-2zm0-4h2v2h-2z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

const SignInPage: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ providers, callbackUrl, errorType }) => {
  const errorMessage = getFriendlyError(errorType);

  return (
    <>
      <Head>
        <title>Sign In</title>
        <meta name="description" content="Sign in to your account" />
        <meta name="robots" content="noindex" />
      </Head>

      <main className={styles.container}>
        <div className={styles.card}>
          {/* ── Header ────────────────────────────────────────────── */}
          <div className={styles.header}>
            <h1 className={styles.title}>Welcome back</h1>
            <p className={styles.subtitle}>Sign in to continue</p>
          </div>

          {/* ── Error banner ──────────────────────────────────────── */}
          {errorMessage && (
            <div className={styles.errorBanner} role="alert">
              <span className={styles.errorIcon}>⚠️</span>
              {errorMessage}
            </div>
          )}

          {/* ── Provider buttons ──────────────────────────────────── */}
          <div className={styles.providerList}>
            {providers &&
              Object.values(providers).map((provider) => (
                <button
                  key={provider.id}
                  className={styles.providerButton}
                  onClick={() =>
                    signIn(provider.id, { callbackUrl, redirect: true })
                  }
                >
                  <ProviderIcon providerId={provider.id} />
                  <span>Continue with {provider.name}</span>
                </button>
              ))}
          </div>

          {/* ── Footer ────────────────────────────────────────────── */}
          <p className={styles.footer}>
            By signing in you agree to our{" "}
            <a href="/terms" className={styles.link}>
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className={styles.link}>
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </main>
    </>
  );
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

export const getServerSideProps: GetServerSideProps<
  SignInPageProps
> = async (ctx) => {
  // Redirect already-authenticated users away from the sign-in page.
  const session = await getServerSideSession(ctx);
  if (session) {
    const callbackUrl =
      typeof ctx.query.callbackUrl === "string"
        ? ctx.query.callbackUrl
        : "/dashboard";
    return { redirect: { destination: callbackUrl, permanent: false } };
  }

  // Fetch the list of configured OAuth providers to render dynamically.
  const providers = await getProviders();

  const callbackUrl =
    typeof ctx.query.callbackUrl === "string"
      ? ctx.query.callbackUrl
      : "/dashboard";

  const errorType =
    typeof ctx.query.error === "string" ? ctx.query.error : null;

  return {
    props: {
      providers: providers ?? {},
      callbackUrl,
      errorType,
    },
  };
};

export default SignInPage;
