# Project Context Document

## Project Overview

This is a **Next.js TypeScript web application** bootstrapped with `create-next-app` and configured for development within [CodeSandbox Projects](https://codesandbox.io/p/dashboard). It serves as a project template for building React-based web applications using the Next.js framework, now extended with a full **authentication system powered by NextAuth.js**.

- **License:** Apache License 2.0 (Copyright 2022 CodeSandbox)
- **Package Name:** `project-template-next.js`
- **Primary Purpose:** A starter/template project for Next.js applications with authentication

---

## Tech Stack

| Technology | Version | Role |
|---|---|---|
| **Next.js** | 12.0.9 | Core framework (SSR, routing, API) |
| **React** | 17.0.2 | UI library |
| **React DOM** | 17.0.2 | React rendering for the browser |
| **TypeScript** | 4.5.5 | Typed JavaScript superset |
| **NextAuth.js** | ^4.x | Authentication (sessions, providers, JWT) |
| **ESLint** | 8.7.0 | Code linting |
| **eslint-config-next** | 12.0.9 | Next.js-specific ESLint rules |
| **@types/node** | 17.0.12 | Node.js type definitions |
| **@types/react** | 17.0.38 | React type definitions |

---

## Project Architecture

This project follows the **Next.js Pages Router** architecture (Next.js 12 convention). The structure now includes authentication-related pages, API routes, and shared components.

```
project-root/
├── pages/                        # Next.js pages and API routes
│   ├── _app.tsx                  # Custom App component (wraps app in SessionProvider)
│   ├── index.tsx                 # Home page (route: "/")
│   ├── auth/
│   │   ├── signin.tsx            # Custom sign-in page
│   │   └── signout.tsx           # Custom sign-out page (optional)
│   └── api/
│       ├── hello.ts              # Example API route (route: "/api/hello")
│       └── auth/
│           └── [...nextauth].ts  # NextAuth.js dynamic catch-all API route
├── components/                   # Shared React components
│   └── auth/
│       ├── AuthGuard.tsx         # Route protection wrapper component
│       └── UserMenu.tsx          # Authenticated user menu/avatar component
├── lib/                          # Shared utilities and configuration
│   └── auth.ts                   # NextAuth.js configuration options (authOptions)
├── styles/                       # CSS styling
│   ├── globals.css               # Global styles (imported in _app.tsx)
│   └── Home.module.css           # CSS Module scoped to the Home page
├── types/                        # Custom TypeScript type definitions
│   └── next-auth.d.ts            # NextAuth.js session/JWT type augmentations
├── .env.local                    # Local environment variables (not committed)
├── .eslintrc.json                # ESLint configuration
├── .gitignore                    # Git ignore rules
├── next-env.d.ts                 # Next.js TypeScript type references (auto-generated)
├── next.config.js                # Next.js configuration
├── package.json                  # Project dependencies and scripts
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## Key Files

### `pages/_app.tsx`
- The **custom App component** that wraps all pages.
- Now wraps the entire application in NextAuth's **`SessionProvider`** to make session state available globally via the `useSession` hook.
- `globals.css` is imported here to apply styles application-wide.

```tsx
import { SessionProvider } from 'next-auth/react';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
```

### `pages/index.tsx`
- The **root page** of the application, served at the `/` route.
- Entry point for the UI — modify this to build out the main page.

### `pages/api/auth/[...nextauth].ts`
- The **NextAuth.js catch-all API route** that handles all authentication endpoints automatically:
  - `GET/POST /api/auth/signin`
  - `GET/POST /api/auth/signout`
  - `GET /api/auth/session`
  - `GET /api/auth/csrf`
  - `GET /api/auth/providers`
  - `GET /api/auth/callback/:provider`
- Imports and uses `authOptions` from `lib/auth.ts`.

```ts
import NextAuth from 'next-auth';
import { authOptions } from '../../../lib/auth';

export default NextAuth(authOptions);
```

### `lib/auth.ts`
- **Centralised NextAuth.js configuration** (`authOptions`).
- Defines authentication **providers** (e.g., GitHub, Google, Credentials, Email).
- Configures **session strategy** (JWT or database sessions).
- Contains **callbacks** for customising session and JWT token content.
- Import `authOptions` here whenever server-side auth is needed (e.g., `getServerSideProps`, API routes).

```ts
import { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [ /* ... */ ],
  session: { strategy: 'jwt' },
  callbacks: { /* session, jwt */ },
  pages: {
    signIn: '/auth/signin',
  },
};
```

### `pages/auth/signin.tsx`
- **Custom sign-in page** rendered at `/auth/signin`.
- Replaces the default NextAuth.js built-in sign-in UI.
- Uses NextAuth's `signIn()` and `getCsrfToken()` utilities.

### `components/auth/AuthGuard.tsx`
- A **route protection wrapper component** that restricts access to authenticated users.
- Uses the `useSession` hook; redirects unauthenticated users to the sign-in page.
- Wrap any page or layout component that requires authentication.

```tsx
// Usage in a protected page
export default function ProtectedPage() {
  return (
    <AuthGuard>
      <PageContent />
    </AuthGuard>
  );
}
```

### `types/next-auth.d.ts`
- **TypeScript module augmentation** for NextAuth.js types.
- Extends the `Session` and `JWT` interfaces to include custom fields (e.g., `user.id`, `user.role`).
- Required whenever custom properties are added to the session or JWT in `authOptions` callbacks.

```ts
import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: string;
    } & DefaultSession['user'];
  }
}
```

### `pages/api/hello.ts`
- A sample **API route** served at `/api/hello`.
- Demonstrates Next.js serverless API route functionality.
- All files inside `pages/api/` are treated as server-side API endpoints, not React pages.

### `next.config.js`
- Next.js configuration file.
- Currently enables **React Strict Mode** (`reactStrictMode: true`).

```js
const nextConfig = {
  reactStrictMode: true,
}
```

### `tsconfig.json`
- TypeScript compiler configuration with strict mode enabled.
- Key settings:
  - `"strict": true` — Enforces full TypeScript strictness.
  - `"target": "es5"` — Compiles down to ES5 for broad browser support.
  - `"module": "esnext"` — Uses ES module syntax.
  - `"jsx": "preserve"` — Leaves JSX transformation to Next.js/Babel.
  - `"incremental": true` — Enables faster incremental TypeScript builds.

### `styles/globals.css`
- Global CSS applied to the entire application.
- Imported once in `pages/_app.tsx`.

### `styles/Home.module.css`
- **CSS Module** scoped to `pages/index.tsx`.
- Class names are locally scoped to prevent global style conflicts.

---

## Authentication Architecture

### How NextAuth.js is Integrated

NextAuth.js v4 is used for authentication. The integration follows this pattern:

1. **Configuration** is centralised in `lib/auth.ts` (`authOptions` object).
2. **API handler** at `pages/api/auth/[...nextauth].ts` consumes `authOptions`.
3. **Session state** is provided globally via `SessionProvider` in `pages/_app.tsx`.
4. **Client-side access** to session uses the `useSession()` hook from `next-auth/react`.
5. **Server-side access** to session uses `getServerSession(req, res, authOptions)` from `next-auth`.

### Accessing the Session

**Client-side (React components):**
```ts
import { useSession } from 'next-auth/react';

const { data: session, status } = useSession();
// status: "loading" | "authenticated" | "unauthenticated"
```

**Server-side (`getServerSideProps` or API routes):**
```ts
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';

export async function getServerSideProps({ req, res }) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return { redirect: { destination: '/auth/signin', permanent: false } };
  }
  return { props: { session } };
}
```

### Protecting API Routes
```ts
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // ... handle authenticated request
}
```

### Triggering Sign-In / Sign-Out

```ts
import { signIn, signOut } from 'next-auth/react';

// Sign in with a provider
await signIn('github');           // OAuth redirect
await signIn('credentials', { redirect: false, email, password });

// Sign out
await signOut({ callbackUrl: '/' });
```

---

## Environment Variables

Authentication requires the following environment variables. Add them to `.env.local` (never commit this file).

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_URL` | Yes | Canonical URL of the app (e.g., `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Yes | Secret used to sign/encrypt JWTs and cookies |
| `GITHUB_ID` | If using GitHub | GitHub OAuth App client ID |
| `GITHUB_SECRET` | If using GitHub | GitHub OAuth App client secret |
| `GOOGLE_CLIENT_ID` | If using Google | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | If using Google | Google OAuth client secret |

Example `.env.local`:
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-here
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret
```

Generate a secure `NEXTAUTH_SECRET` with:
```bash
openssl rand -base64 32
```

The `.gitignore` includes the following env file patterns (not committed to source control):
- `.env.local`
- `.env.development.local`
- `.env.test.local`
- `.env.production.local`

Use `NEXT_PUBLIC_` prefix to expose non-sensitive variables to the browser.

---

## Coding Conventions

### Language & Typing
- All source files use **TypeScript** (`.ts` / `.tsx`).
- **Strict TypeScript** is enforced — avoid using `any` types.
- React component files use the `.tsx` extension; non-JSX TypeScript files use `.ts`.
- NextAuth.js types are augmented in `types/next-auth.d.ts` — always extend types there when adding custom session/JWT fields rather than using type assertions.

### Linting
- ESLint is configured via `.eslintrc.json` with the `next/core-web-vitals` ruleset.
- This enforces Next.js best practices and Core Web Vitals performance rules.

```json
{
  "extends": "next/core-web-vitals"
}
```

- Run the linter with: `npm run lint`

### Styling
- **Global styles** go in `styles/globals.css` and are imported in `_app.tsx`.
- **Component/page-scoped styles** use **CSS Modules** (e.g., `ComponentName.module.css`).
- CSS Module classes are accessed as object properties: `styles.className`.

### File & Folder Naming
- Pages and components follow **camelCase** or **PascalCase** conventions (standard Next.js).
- CSS Module files mirror the component they style (e.g., `Home.module.css` → `index.tsx`).
- Authentication-related components are grouped under `components/auth/`.
- Shared utility/configuration modules live in `lib/`.

### API Routes
- Serverless API handlers are placed under `pages/api/`.
- Each file exports a default handler function with the signature:
  ```ts
  export default function handler(req: NextApiRequest, res: NextApiResponse) {}
  ```
- Protected API routes should validate the session using `getServerSession(req, res, authOptions)` at the top of the handler.

### Authentication Conventions
- **Always import `authOptions` from `lib/auth.ts`** — never duplicate the configuration.
- **Use `getServerSession`** (not the deprecated `getSession`) for server-side session access.
- **Use `useSession`** for client-side session access; check `status` before reading `data`.
- **Custom session fields** must be declared in `types/next-auth.d.ts` to maintain type safety.
- **Route protection** should use the `AuthGuard` component for client-side guarding or `getServerSideProps` redirect pattern for server-side guarding.

---

## Development Workflow

### Prerequisites
- Node.js (recommended: v16+)
- npm, yarn, or pnpm

### Available Scripts

| Script | Command | Description |
|---|---|---|
| **Development** | `npm run dev` | Starts the dev server at `http://localhost:3000` with hot reload |
| **Build** | `npm run build` | Creates an optimized production build |
| **Start** | `npm run start` | Serves the production build locally |
| **Lint** | `npm run lint` | Runs ESLint across the project |

### Development Server
```bash
npm run dev
# or
yarn dev
```
- The app is accessible at `http://localhost:3000`.
- Supports **Fast Refresh** — changes to React components reflect instantly without full page reload.
- Ensure `.env.local` is populated with `NEXTAUTH_URL` and `NEXTAUTH_SECRET` before starting.

### Build & Deployment
```bash
npm run build   # Build for production
npm run start   # Run production server
```
- Output is placed in the `.next/` directory (gitignored).
- The project is optimized for deployment on **Vercel** (`.vercel` is gitignored).
- On Vercel, set `NEXTAUTH_URL` to the deployed domain and configure all provider secrets in the environment variables dashboard.

---

## Important Notes for AI Assistance

1. **Next.js Version:** This uses **Next.js 12** with the **Pages Router** — not the App Router introduced in Next.js 13+. Do not suggest App Router patterns (`app/` directory, Server Components, etc.).
2. **React Version:** This uses **React 17** — hooks are available, but React 18 concurrent features are not.
3. **Strict Mode is ON:** All TypeScript code must be fully typed. Avoid `any`, use proper interfaces and types.
4. **CSS Modules for scoped styles:** Avoid inline styles or global class names for component-level styling.
5. **API Routes are serverless functions:** They run server-side only and should not import browser-specific APIs.
6. **No testing framework is configured** in the current setup