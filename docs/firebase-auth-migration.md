# Firebase Authentication Migration (staged)

## Current status

- The storefront currently uses Supabase Auth directly in `app.js` (`signUp`, `signInWithPassword`, `verifyOtp`, `signOut`, password reset, OAuth).
- The Supabase client is created in `supabase.js`.
- Profile and wallet rows use UUID keys, and order/top-up RPCs and RLS policies use `auth.uid()`.
- Firebase project: `l1017n`; Supabase project ref: `aybsettkyxfugntizfqq`.

## Important compatibility constraint

Firebase's client-created UIDs are not guaranteed to be UUIDs. Existing database tables/functions rely on UUID user IDs and `auth.uid()`; switching only the client sign-in provider can break profile/wallet lookups and transactional RPCs.

Do not deploy a client-only auth swap. Do not loosen RLS or expose a Supabase service-role key in browser code.

## Staged plan

1. Keep production auth and existing data unchanged while preparing the migration.
2. Choose and implement a trusted identity bridge:
   - Either provision Firebase users with UUID UIDs using a trusted backend and Firebase Admin credentials, or
   - Implement a complete server-verified Firebase UID-to-database UUID mapping and update all affected policies/functions consistently.
3. Set the Firebase custom claim `role: "authenticated"` using a trusted server-side process, as required by Supabase's Firebase third-party auth integration.
4. Configure the Supabase JS client to pass the current Firebase ID token using its `accessToken` option; remove the old Supabase Auth flows only when the identity bridge is ready.
5. Update sign-up, email verification, sign-in, sign-out, password reset, OAuth/avatar handling, and session restoration.
6. Test with a new account: profile creation, wallet initialization, product stock reads, order creation, top-up creation, RLS isolation, and admin authorization.
7. Deploy only after all checks pass. Keep existing profiles, wallets, and orders as a rollback backup until the new path is verified.

## Required secret handling

A trusted Firebase Admin backend credential is needed for server-managed UID/custom-claim provisioning. Store credentials only as Cloudflare Worker secrets or an equivalent server-side secret store. Never commit service-account JSON/private keys or paste them into frontend files.

## Acceptance checklist

- [ ] A new Firebase account can sign up and verify its email.
- [ ] Refreshing the page restores the Firebase session.
- [ ] Supabase receives the Firebase ID token and recognizes it as authenticated.
- [ ] The database identity resolves to the correct UUID consistently.
- [ ] A user can only read their own profile, wallet, top-ups, orders, and order codes.
- [ ] A user cannot grant themselves admin privileges.
- [ ] Wallet checkout remains atomic and cannot overspend or sell unavailable stock.
- [ ] Password reset and logout work.
- [ ] Production data and the existing production deployment remain unchanged until rollout approval.

## Official integration reference

https://supabase.com/docs/guides/auth/third-party/firebase-auth

## Read-only repository and live-schema audit (2026-10-18)

This audit inspected the current branch's auth flow and queried production schema metadata only. No production rows, policies, functions, or deployments were changed.

### Findings confirmed from the live schema

- `public.profiles.id` is UUID and has a foreign key to `auth.users.id`.
- `public.wallets.user_id`, `public.wallet_topups.user_id`, `public.orders.user_id`, `public.wallet_transactions.user_id`, and the exchange tables' user references are UUIDs linked to `public.profiles`.
- Profile/wallet/order RPCs and authorization helpers depend on `auth.uid()`.
- The current browser flow in `app.js` calls Supabase Auth directly for session restore, sign-up, password login, email OTP verification, sign-out, password reset, and OAuth.
- Production currently reports 102 profiles, 102 wallets, and 22 orders. These counts were read as schema/table metadata and are not a migration target.

### Important blocker before writing the auth swap

A Firebase UID being UUID-shaped is **not sufficient by itself**: the current `profiles.id -> auth.users.id` foreign key requires a matching Supabase Auth user row too. A direct Firebase-only sign-up would not automatically create that row. Also, Firebase's signed `sub` claim cannot simply be replaced by a client-side UUID mapping.

Therefore, do not implement a client-only Firebase swap, do not drop the foreign key or weaken RLS as a shortcut, and do not create a service-account key yet.

### Safe implementation sequence

1. Build a disposable Supabase development branch/project and test Firebase third-party JWT acceptance there.
2. Prove an identity design that satisfies all three constraints together: verified Firebase ID token, UUID identity used by `auth.uid()`, and valid references for profile/wallet/order rows. Explicitly verify whether the required `auth.users` row can be provisioned safely without relying on unsupported direct writes to Supabase's managed auth schema.
3. If a supported design cannot preserve those constraints, stop and present the trade-offs before any production schema change.
4. Only after the identity design is proven, implement server-side provisioning and email verification. Keep service-account credentials out of GitHub and browser code; add them only to the chosen backend's secret store when the code is ready.
5. Test signup, email verification, login, logout, password reset, RLS isolation, profile/wallet bootstrap, checkout atomicity, order-code visibility, and admin authorization in the disposable environment.
6. Review a non-draft PR and obtain explicit approval before production deployment.

### Current implementation status

No auth code has been swapped. `index.html`, `app.js`, `supabase.js`, `worker.js`, production database schema/data, and the live deployment remain unchanged by this audit.

