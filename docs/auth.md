# Recruiter Auth Setup

The recruiter product now uses an app-owned password + session foundation with:

- `users`
- `companies`
- `company_memberships`
- `sessions`

Recruiter pages under `/jobs` and recruiter APIs under `/api/recruiter/*` require authentication.

## Environment

Add these values to `.env.local` to bootstrap the initial recruiter company account:

```env
AUTH_SEED_EMAIL=recruiter@company.com
AUTH_SEED_PASSWORD=change-me
AUTH_SEED_NAME=Recruiter Admin
AUTH_SEED_COMPANY_NAME=Company Recruiting
AUTH_SEED_COMPANY_SLUG=company-recruiting
AUTH_SEED_WORKSPACE_KEY=operations
```

Add these values to enable Google sign-in:

```env
AUTH_GOOGLE_CLIENT_ID=your-google-oauth-client-id
AUTH_GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
AUTH_GOOGLE_HOSTED_DOMAIN=
```

Notes:

- `AUTH_SEED_EMAIL` and `AUTH_SEED_PASSWORD` are the minimum required values.
- The seed runs lazily on auth access, so the account is created the first time the login flow or session lookup runs.
- `AUTH_SEED_WORKSPACE_KEY` is optional and exists as a workspace-compatible foundation field for later recruiter workspace work.
- Google sign-in is optional. If it is configured, the login page offers both Google and password login.
- `AUTH_GOOGLE_HOSTED_DOMAIN` is optional. When set, Google sign-in is restricted to that email domain.
- Google sign-in only succeeds when the returned verified Google email already matches a local recruiter user record. This keeps company membership assignment inside the app-owned auth model.

## Google OAuth setup

In Google Cloud Console:

1. Create or reuse an OAuth client of type `Web application`.
2. Add your app origin under authorized origins as needed.
3. Add the callback URL for each environment under authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback`
   - `https://<your-domain>/auth/google/callback`
4. Configure the OAuth consent screen for your workspace as needed.

The app builds the callback URL from the current request origin, so the Google client must allow every origin you plan to use.

## Behavior

- Successful login creates an HTTP-only session cookie and a persisted session record.
- Google login redirects through `/auth/google` and `/auth/google/callback`, then creates the same HTTP-only recruiter session cookie as password login.
- Recruiter layouts redirect unauthenticated users to `/auth/login`.
- Recruiter APIs return `401` when a valid authenticated session is missing.
- Logging out removes the server-side session and clears the cookie.

## Persistence

- With `DATABASE_URL`, auth records persist in Postgres through the existing Drizzle/runtime-store path.
- Without `DATABASE_URL`, auth state falls back to the in-memory runtime store used by tests.

## Migrations

After pulling these changes:

```bash
npm run db:migrate
```
