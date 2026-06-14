# Next.js + NextAuth.js Starter

A production-ready **Next.js 12** template with a complete **NextAuth.js v4** authentication system. Supports GitHub and Google OAuth out of the box, with JWT sessions, TypeScript-typed session extensions, protected pages, protected API routes, and edge middleware.

---

## Features

| Feature | Details |
|---|---|
| **OAuth providers** | GitHub, Google (easily add 50+ more) |
| **Session strategy** | JWT — no database adapter required |
| **TypeScript** | Full type safety via module augmentation (`types/next-auth.d.ts`) |
| **Custom pages** | `/auth/signin`, `/auth/error` |
| **Route protection** | Edge Middleware (`middleware.ts`) + SSR (`lib/auth.ts`) + client hook (`hooks/useAuthGuard.ts`) |
| **Protected API route** | `/api/protected-example` with auth + role check |
| **Role system** | `"user"` / `"admin"` roles baked into JWT & session |

---

## Project Structure

```
├── hooks/
│   └── useAuthGuard.ts          # Client-side auth guard hook
├── lib/
│   └── auth.ts                  # Server-side session helpers
├── pages/
│   ├── _app.tsx                 # SessionProvider wrapper
│   ├── index.tsx                # Public home page
│   ├── dashboard.tsx            # Protected page (SSR + client guard)
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth].ts # NextAuth catch-all handler
│   │   ├── hello.ts             # Original example API route
│   │   └── protected-example.ts # Auth + role-gated API route
│   └── auth/
│       ├── signin.tsx           # Custom sign-in page
│       └── error.tsx            # Custom auth error page
├── styles/
│   ├── Auth.module.css          # Styles for auth pages
│   ├── Dashboard.module.css     # Styles for the dashboard
│   ├── Home.module.css          # Styles for the home page
│   └── globals.css              # Global styles
├── types/
│   └── next-auth.d.ts           # Session/JWT type extensions
├── middleware.ts                 # Edge middleware (route protection)
├── next.config.js
├── .env.local.example           # Environment variable template
└── package.json
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in:

| Variable | Description |
|---|---|
| `NEXTAUTH_URL` | Your app's base URL (`http://localhost:3000` for dev) |
| `NEXTAUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `GITHUB_ID` | GitHub OAuth App Client ID |
| `GITHUB_SECRET` | GitHub OAuth App Client Secret |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |

### 3. Create OAuth apps

**GitHub:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers) → *New OAuth App*
2. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`

**Google:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → *Create OAuth 2.0 Client ID*
2. Add **Authorised redirect URI**: `http://localhost:3000/api/auth/callback/google`

### 4. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## Authentication Architecture

### Three-layer route protection

```
Request
   │
   ▼
┌──────────────────────────────────────┐
│  Edge Middleware (middleware.ts)      │  ← fastest, runs before any handler
│  Reads JWT cookie via getToken()     │
│  Redirects unauthenticated requests  │
└──────────────────────────────────────┘
   │ authenticated
   ▼
┌──────────────────────────────────────┐
│  getServerSideProps (lib/auth.ts)    │  ← SSR, runs in Node.js
│  requireSession / requireRole        │
│  Passes session as a page prop       │
└──────────────────────────────────────┘
   │ props with session
   ▼
┌──────────────────────────────────────┐
│  useAuthGuard hook (React)           │  ← client-side re-validation
│  Catches mid-session expiry          │
│  Redirects without a full page load  │
└──────────────────────────────────────┘
```

### JWT session flow

```
Sign-in
   │
   ▼  jwt callback (first sign-in)
Token ← { sub, name, email, picture, id, role }
   │
   ▼  session callback (every request)
Session.user ← { id, name, email, image, role }
   │
   ▼
useSession() / getServerSession()
```

---

## Protecting a Page (SSR)

```tsx
// pages/my-protected-page.tsx
import { GetServerSideProps } from "next";
import { requireSession } from "../lib/auth";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const result = await requireSession(ctx);
  if ("redirect" in result) return result; // unauthenticated → sign-in
  return result; // { props: { session } }
};
```

## Protecting a Page (Admin only)

```tsx
import { GetServerSideProps } from "next";
import { requireRole } from "../lib/auth";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const result = await requireRole(ctx, "admin");
  if ("redirect" in result) return result;
  return result;
};
```

## Protecting an API Route

```ts
// pages/api/my-endpoint.ts
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  // ... your logic
}
```

## Client-side guard hook

```tsx
import { useAuthGuard } from "../hooks/useAuthGuard";

export default function MyPage() {
  const { isLoading, isAuthorized, session } = useAuthGuard({
    requiredRole: "admin",          // optional
    unauthorizedRedirect: "/",      // optional, defaults to "/"
  });

  if (isLoading || !isAuthorized) return null;
  return <p>Hello {session?.user?.name}</p>;
}
```

## Adding a Role to a User

Roles are assigned inside the `jwt` callback in `pages/api/auth/[...nextauth].ts`. The simplest approach is to check the user's email or ID against a list / database:

```ts
async jwt({ token, user }) {
  if (user) {
    token.id = user.id;
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") ?? [];
    token.role = adminEmails.includes(user.email ?? "") ? "admin" : "user";
  }
  return token;
}
```

## Adding More Providers

1. Import the provider from `next-auth/providers/*`.
2. Add it to the `providers` array in `pages/api/auth/[...nextauth].ts`.
3. Add the required env vars to `.env.local` and `.env.local.example`.

```ts
import TwitterProvider from "next-auth/providers/twitter";

providers: [
  // ... existing providers
  TwitterProvider({
    clientId: requireEnv("TWITTER_CLIENT_ID"),
    clientSecret: requireEnv("TWITTER_CLIENT_SECRET"),
    version: "2.0",
  }),
]
```

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| Dev server | `npm run dev` | Starts at `http://localhost:3000` with hot reload |
| Build | `npm run build` | Creates an optimised production build |
| Start | `npm run start` | Serves the production build |
| Lint | `npm run lint` | Runs ESLint |

---

## License

Apache License 2.0 — Copyright 2022 CodeSandbox. See [LICENSE.txt](LICENSE.txt).
