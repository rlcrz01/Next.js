/**
 * Custom App component — the root of every page in the application.
 *
 * Changes from the original template:
 *  1. `SessionProvider` wraps the entire tree so that any child component
 *     can call `useSession()` without prop-drilling.
 *  2. `pageProps.session` is forwarded to `SessionProvider`; NextAuth
 *     pre-populates this prop during server-side rendering when you call
 *     `getServerSideSession` (see lib/auth.ts) inside a page's
 *     `getServerSideProps`, which avoids a client-side session fetch
 *     waterfall on first load.
 *
 * Docs: https://next-auth.js.org/getting-started/client#sessionprovider
 */

import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps): JSX.Element {
  return (
    /**
     * `session` — initial session value passed from getServerSideProps.
     *             When undefined (CSR navigation), NextAuth fetches it
     *             automatically from /api/auth/session.
     *
     * `refetchInterval` — re-validates the session every 5 minutes in the
     *                     background to keep the client in sync with any
     *                     server-side expiry or revocation.
     *
     * `refetchOnWindowFocus` — re-validates immediately when the user
     *                          switches back to the tab, catching sessions
     *                          that expired while the tab was in the background.
     */
    <SessionProvider
      session={pageProps.session}
      refetchInterval={5 * 60}
      refetchOnWindowFocus={true}
    >
      <Component {...pageProps} />
    </SessionProvider>
  );
}
